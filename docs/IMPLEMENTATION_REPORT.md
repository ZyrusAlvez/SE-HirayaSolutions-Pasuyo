📘 **SOFTWARE CONSTRUCTION DOCUMENTATION**
**Project: Pasuyo
Feature Scope: Frontend – Login Page
Sprint Coverage: Initial Implementation**

**PART I: Software Implementation**

**1️⃣ Implemented Feature
Feature: Login Page (Frontend Only)**

This sprint focuses on implementing the User Login Interface for the Pasuyo system.
The login page serves as the entry point for two types of users:
- Commissioners
- Clients (Customers)

**2️⃣ Core Requirements Implemented**
**Based on approved requirements and UML diagrams:**
**Functional Requirements (Frontend Scope)**

  - User can input:
    - Email
    - Password
      - Password have show and hide characters
  - Login button triggers validation
  - Form validation:
    - Required fields
    - Valid email format
  - Error message display for invalid input
  - Responsive layout
  - Clean and consistent UI design


**3️⃣ UML Alignment**
<img width="1060" height="860" alt="image" src="https://github.com/user-attachments/assets/5fc3c549-34d1-4d0c-a1a3-337f4c0f27bd" />
**Related UML Diagram: Use Case Diagram**

Use Case: User Logs In

Actor: Client / Commissioner

System Action: Verify Credentials (Backend – future sprint)

For this sprint, only the UI portion is implemented.

**4️⃣ End-to-End Workflow (Frontend Simulation)**

Although backend authentication is not yet implemented, the workflow demonstrated is:

1. User opens login page

2. User inputs email and password

3. System validates input format

4. If invalid → shows error message

5. If valid → triggers placeholder success message or redirect (mock behavior)

This demonstrates a working UI flow without runtime errors.

**5️⃣ System Status**

  - Runs successfully

  - No critical runtime errors

  - Form validation functional

**PART II: CODING STANDARDS & CODE QUALITY**

**1️⃣ Coding Standards Followed**
The team agreed on the following standards:
**Naming Conventions**
  - camelCase for variables and functions
  - PascalCase for components
  - Clear and descriptive names

**2️⃣ Code Structure**
src/
  frontend/
    app/
      _layout.tsx
      Index,tsx
      login.tsx
    assets/images
      android-icon-background.png
      android-icon-foreground.png
      android-icon-monochrome.png
      favicon.png
      icon.png
      partial-react-logo.png
      react-logo.png
      react-logo@2x.png
      react-logo@3x.png
      splash-icon.png
    README.md
    app.json
    eslint.config.js
    package-lock.json
    package.json
    tsconfig.json

- Separation of concerns observed

- Application screens organized inside /app

- Layout centralized in _layout.tsx

- Static assets isolated in /assets/images

- Configuration files separated at root level

- TypeScript used for better maintainability

- ESLint configured to enforce coding standards

- Structure is clean and scalable for future features


**3️⃣ Readability & Maintainability**

  - Comments added for major functions

  - Proper indentation

  - Consistent spacing

  - Avoided unnecessary nested logic
    
**4️⃣ Sensitive Data Handling**

  - No passwords or API keys hardcoded

  - No test credentials included in code

  - Environment variables reserved for future backend integration

**PART III: VERSION CONTROL & COLLABORATION**

**Git Workflow Used**
[See Here our Git Workflow](docs/GIT_WORKFLOW.md)

**Evidence of Collaboration**

  - Multiple commits from different members

  - Each member contributed at least one meaningful commit


**Merge Conflicts**

  - No unresolved merge conflicts
    
  - All conflicts resolved before merge

**PART IV: SECURE CODING AWARENESS**
**Security Consideration #1: Input Validation**
**Risk:**
  - Users may enter malicious input (e.g., script injection).
**Where Risk Exists:**
  - Login input fields (email).
**Mitigation:**
  - Frontend validation
  - Sanitized input handling
  - No direct rendering of raw user input

**PART V: CODE REVIEW & REFLECTION**
**1️⃣ Strength of Current Codebase**
The codebase is clean, modular, and follows consistent naming conventions. The separation of UI components improves maintainability and scalability.

**2️⃣ Area for Improvement**
Error handling can be improved when backend authentication is integrated. We also plan to improve accessibility features.

**3️⃣ Lessons Learned**
  - Clear Git workflow prevents confusion.

  - Small, meaningful commits improve collaboration.

  - Frontend validation is important even before backend integration.

  - Clean structure early makes scaling easier.
