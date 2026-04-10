# Auth UI Polish Design

## Goal

Polish the new authentication UI so it matches the existing MiniMRP visual language and reduces accidental logout clicks.

## Chosen Direction

Use the existing app design system rather than creating a visually separate auth experience.

This means:

- login page keeps the same panel, spacing, and muted industrial style as the rest of the app
- form controls use existing shared CSS classes like `.input`, `.button`, and `.notice`
- logout moves into the left navigation area as a deliberate action row rather than a loose button

## Login Page

The login page should feel like part of the same internal tool:

- centered but not flashy
- clear title and short explanatory copy
- panel-based card using the same border, shadow, and spacing language as the app
- proper styled inputs and primary submit button
- error state shown using the existing notice/error treatment

## Logout Interaction

The logout action should become a navigation-style action item placed after the normal nav links.

Requirements:

- visually aligned with the existing sidebar links
- distinct enough that it is not confused with normal navigation
- includes a small exit-style icon cue
- not styled as an aggressive danger action, because logout is reversible

## Non-Goals

- no large auth hero redesign
- no separate brand theme for login
- no modal logout flow
- no MFA UI yet
