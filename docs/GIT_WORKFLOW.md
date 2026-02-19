# Git Workflow Documentation

## 1. Repository Overview

This repository contains the source code for the Pasuyo System.
To ensure proper collaboration, code quality, and version control, the team follows a structured Git workflow.

All members are required to follow the branching, merging, and commit standards defined in this document.

## 2. Branching Strategy

We use the following branch structure:

- main  
  - Contains production-ready and stable code only.
  - Protected branch (no direct push allowed).

- feature/*  
  - Used for developing new features.
  - Created from the main branch.
  - Example:
    - feature/user-authentication
    - feature/request-submission

## 3. Merge Rules

To maintain code integrity:

- ❌ No direct push to `main`
- ✅ Feature branch → Pull Request → Merge
- ✅ At least one team member must review and approve the Pull Request
- ✅ All conflicts must be resolved before merging
- ✅ Code must be tested before approval

Only after approval can the feature branch be merged into `main`.

## 4. Pull Request Process

All changes must follow this process:

1. Create a new feature branch from `main`
2. Implement the feature
3. Commit changes using proper commit message format
4. Push the feature branch to the remote repository
5. Open a Pull Request
6. Assign at least one reviewer
7. Address review comments (if any)
8. Merge after approval

After merging, the feature branch may be deleted.

## 5. Commit Message Format (Logging Structure)

To maintain a clean project history, commit messages must follow this format:

<Type>: Short description

### Allowed Types:

- feat → New feature
- fix → Bug fix
- docs → Documentation changes
- refactor → Code improvement without changing functionality
- test → Adding or modifying tests
- chore → Minor maintenance tasks

### Examples:

feat: add commissioner request acceptance feature  
fix: resolve login authentication issue  
docs: update GIT_WORKFLOW documentation  
refactor: improve request validation logic  

Commit messages must be:
- Clear
- Concise
- Written in lowercase
- Descriptive of the change made

## 6. General Version Control Rules

- Pull latest changes before starting new work
- Make small, meaningful commits
- Avoid committing unnecessary files
- Do not commit directly to `main`
- Ensure code is functional before pushing

## 7. Review Responsibility

Each team member is responsible for:

- Reviewing assigned Pull Requests carefully
- Providing constructive feedback
- Ensuring coding standards are followed
- Approving only tested and working features
