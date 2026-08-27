/**
 * roles.test.js
 *
 * This module decides where somebody lands after signing in and which doors
 * they are shown. The gateway enforces the real rules, so a mistake here does
 * not leak data — it produces the two failures this project has already
 * shipped once each: a door that opens onto a refusal, and a page with no door
 * to it at all.
 *
 * The tests are written against the roles and the routes rather than against
 * the implementation, so the map can be reorganised without rewriting them.
 */
import { describe, expect, it } from 'vitest'

import {
  ROLES,
  ROLE_HOME,
  ROUTE_ROLES,
  homeRouteFor,
  primaryRole,
  roleLabel,
  rolesForPath,
} from './roles'

const ALL_ROLES = Object.values(ROLES)

describe('homeRouteFor', () => {
  it('sends a patient to their own portal, not the staff overview', () => {
    expect(homeRouteFor([ROLES.PATIENT])).toBe('/my-health')
  })

  it('sends a doctor to their day', () => {
    expect(homeRouteFor([ROLES.DOCTOR])).toBe('/today')
  })

  it('sends a laboratory technician to the laboratory', () => {
    // This was '/' until recently, which meant an account that signed in
    // successfully landed immediately on a refusal.
    expect(homeRouteFor([ROLES.LAB_TECHNICIAN])).toBe('/labs')
  })

  it.each([ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.BILLING, ROLES.NURSE])(
    'sends %s to the staff overview',
    (role) => {
      expect(homeRouteFor([role])).toBe('/')
    }
  )

  it('defaults to the overview when the roles are unknown or absent', () => {
    expect(homeRouteFor([])).toBe('/')
    expect(homeRouteFor()).toBe('/')
    expect(homeRouteFor(['SOMETHING_ELSE'])).toBe('/')
  })

  it('lands every role somewhere its own role may open', () => {
    // The property that matters, stated once: no role may be sent to a page
    // its own role is not allowed to see. Both dead ends this project has had
    // would have failed here.
    for (const role of ALL_ROLES) {
      const home = homeRouteFor([role])
      const allowed = rolesForPath(home)
      expect(allowed, role + ' lands on ' + home + ', which has no rule').toBeDefined()
      expect(allowed, role + ' lands on ' + home + ', which refuses it').toContain(role)
    }
  })
})

describe('primaryRole', () => {
  it('picks the widest role when somebody carries several', () => {
    expect(primaryRole([ROLES.NURSE, ROLES.ADMIN])).toBe(ROLES.ADMIN)
    expect(primaryRole([ROLES.PATIENT, ROLES.DOCTOR])).toBe(ROLES.DOCTOR)
    expect(primaryRole([ROLES.BILLING, ROLES.RECEPTIONIST])).toBe(ROLES.RECEPTIONIST)
  })

  it('does not depend on the order the roles arrive in', () => {
    expect(primaryRole([ROLES.ADMIN, ROLES.NURSE])).toBe(
      primaryRole([ROLES.NURSE, ROLES.ADMIN])
    )
  })

  it('is null rather than undefined-ish when there is no known role', () => {
    expect(primaryRole([])).toBeNull()
    expect(primaryRole()).toBeNull()
    expect(primaryRole(['NOT_A_ROLE'])).toBeNull()
  })
})

describe('rolesForPath', () => {
  it('returns the rule for a literal path', () => {
    expect(rolesForPath('/billing')).toEqual(ROUTE_ROLES['/billing'])
  })

  it('matches a concrete id back to its route pattern', () => {
    // Returning undefined here is what RequireRole reads as
    // "authenticated-only", which once let a patient open /patients/5.
    expect(rolesForPath('/patients/5')).toEqual(ROUTE_ROLES['/patients/:id'])
    expect(rolesForPath('/patients/9999')).toContain(ROLES.DOCTOR)
    expect(rolesForPath('/patients/5')).not.toContain(ROLES.PATIENT)
  })

  it('does not match a path with the wrong number of segments', () => {
    expect(rolesForPath('/patients/5/extra')).toBeUndefined()
  })

  it('does not treat a literal segment as a wildcard', () => {
    expect(rolesForPath('/nonsense/5')).toBeUndefined()
  })

  it('has no rule for a route nobody has described', () => {
    expect(rolesForPath('/not-a-route')).toBeUndefined()
  })

  it('keeps the laboratory open to the technician and everything else closed', () => {
    expect(rolesForPath('/labs')).toContain(ROLES.LAB_TECHNICIAN)
    expect(rolesForPath('/billing')).not.toContain(ROLES.LAB_TECHNICIAN)
    expect(rolesForPath('/appointments')).not.toContain(ROLES.LAB_TECHNICIAN)
    expect(rolesForPath('/prescriptions')).not.toContain(ROLES.LAB_TECHNICIAN)
    expect(rolesForPath('/patients')).not.toContain(ROLES.LAB_TECHNICIAN)
  })

  it('keeps a patient out of every staff route', () => {
    for (const [route, roles] of Object.entries(ROUTE_ROLES)) {
      if (route === '/my-health') continue
      expect(roles, route + ' admits a patient').not.toContain(ROLES.PATIENT)
    }
  })

  it('keeps staff out of the patient portal', () => {
    expect(ROUTE_ROLES['/my-health']).toEqual([ROLES.PATIENT])
  })
})

describe('the map itself', () => {
  it('names only roles that exist', () => {
    for (const [route, roles] of Object.entries(ROUTE_ROLES)) {
      for (const role of roles) {
        expect(ALL_ROLES, route + ' names an unknown role: ' + role).toContain(role)
      }
    }
    for (const role of Object.keys(ROLE_HOME)) {
      expect(ALL_ROLES).toContain(role)
    }
  })

  it('admits somebody to every route it describes', () => {
    for (const [route, roles] of Object.entries(ROUTE_ROLES)) {
      expect(roles.length, route + ' admits nobody').toBeGreaterThan(0)
    }
  })

  it('gives every role at least one route it can open', () => {
    for (const role of ALL_ROLES) {
      const open = Object.entries(ROUTE_ROLES).filter(([, roles]) => roles.includes(role))
      expect(open.length, role + ' can open nothing').toBeGreaterThan(0)
    }
  })
})

describe('roleLabel', () => {
  it('writes every role in sentence case, as the alert guidance requires', () => {
    for (const role of ALL_ROLES) {
      const label = roleLabel(role)
      expect(label).not.toBe(role)
      expect(label).toBe(label.charAt(0).toUpperCase() + label.slice(1))
      expect(label).not.toMatch(/_/)
    }
  })

  it('spells out the abbreviation rather than showing LAB_TECHNICIAN', () => {
    expect(roleLabel(ROLES.LAB_TECHNICIAN)).toBe('Lab technician')
  })

  it('returns an unmapped value unchanged rather than throwing', () => {
    expect(roleLabel('SOMETHING_NEW')).toBe('SOMETHING_NEW')
  })
})
