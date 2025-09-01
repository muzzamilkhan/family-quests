# Product Requirements Document (PRD): Family Quests

## 1. Goals and Background Context
### Goals
* Provide an engaging, adventure-like experience for children (4+) to complete daily **quests**.
* Offer a fast, efficient, and intuitive **Quest Board** for busy parents to manage the family's adventures.
* Foster a sense of collaborative family participation and mutual accountability.
* Create a clear and motivating loop between effort (**quests**) and rewards (**treasure**).
* Ensure the application is simple and accessible enough for a 4-year-old to use independently on a mobile or tablet device.

### Background Context
Families often struggle with the friction of managing household chores. "Family Quests" reframes this challenge by creating a positive, reward-based ecosystem. It leverages gamification to transform chores into exciting quests, turning a point of contention into a fun, shared family adventure. The primary focus is an intuitive, icon-driven experience for young children, balanced with a powerful and efficient management interface for parents.

### Change Log
| Date | Version | Description | Author |
| :--- | :--- | :--- | :--- |
| 2025-09-01 | 1.0 | Initial PRD draft with "Family Quests" branding. | John (PM) |

---
## 2. Requirements
### Functional
* **FR1**: Parents (Quest Masters) must be able to create, edit, and delete Quests.
* **FR2**: Each Quest must have properties: Name, Point Value, Frequency (daily, weekly, etc.), Icon, and Child Assignment.
* **FR3**: Children (Adventurers) must be able to view their assigned Quests for the day on a personal dashboard.
* **FR4**: Adventurers must be able to mark a Quest as "complete" to submit it for review.
* **FR5**: Quest Masters must be able to review submitted Quests and either "Approve" (awarding points) or "Reject" them.
* **FR6**: The system must maintain a points ledger for each Adventurer.
* **FR7**: Quest Masters must be able to create a list of Rewards (Treasure) with associated point costs in a "Treasury".
* **FR8**: Adventurers must be able to redeem their points for Treasure from the Treasury.
* **FR9**: Quest Masters must be able to mark a redeemed Treasure as "fulfilled".
* **FR10**: Users must be able to sign in via Google.
* **FR11**: Quest Masters can create a "Family" group and invite a co-parent.
* **FR12**: Quest Masters can add Adventurers to the Family using a name and an optional email.
* **FR13**: Each Adventurer will be assigned a unique permalink for login.
* **FR14**: Adventurers with an associated email can also log in via Google.
* **FR15**: All users can upload a profile photo.

### Non-Functional
* **NFR1**: The application must be responsive and optimized for mobile and tablet devices.
* **NFR2**: The UI for Adventurers must be highly performant, with animations and interactions feeling smooth and instantaneous.
* **NFR3**: Any changes made by a Quest Master on the Quest Board must be reflected in the Adventurer's UI in near real-time.
* **NFR4**: All user data, particularly children's information, must be stored securely.

---
## 3. User Interface Design Goals
* **Overall UX Vision**: An enchanted, adventurous, and encouraging user experience. The theme should feel less like a utility and more like a fantasy game, using elements like treasure maps, magical animations, and celebratory sounds to delight users.
* **Key Interaction Paradigms**: Tapping an icon to "Accept a Quest"; a celebratory "Quest Complete!" animation with confetti or sparkles upon approval; a treasure chest opening when a reward is redeemed.
* **Core Screens**:
    * **Today's Quest Log**: The main dashboard for the child, showing assigned quests visually.
    * **The Quest Board**: The main management view for parents, designed for rapid entry and inline editing.
    * **The Treasury**: The rewards store where children can browse and redeem treasures.
    * **Family Hall of Heroes**: The user management screen where profiles and photos are displayed.
* **Accessibility**: WCAG AA, ensuring clear contrasts and large tap targets for young children.
* **Branding**: A playful, fantasy, or adventure-themed aesthetic. The design should incorporate a rich color palette and custom icons that are easily identifiable by pre-readers.

---
## 4. Technical Assumptions
* **Repository Structure**: Monorepo, to facilitate sharing of types and logic between the frontend application and backend API.
* **Service Architecture**: Serverless functions (e.g., Vercel Functions, AWS Lambda) to handle API requests for cost-efficiency and scalability.
* **Testing Requirements**: A combination of unit and integration tests are required. End-to-end tests will be planned for critical user flows like quest completion and reward redemption.

---
## 5. Epic List
* **Epic 1: The Adventure Begins (Foundation & User Setup)**: Establish the core project, authentication, and the ability for a parent to create their family and profiles.
* **Epic 2: The Quest Board (Quest Management)**: Implement the full lifecycle of quest creation and management for parents, including the real-time sync to the child's view.
* **Epic 3: The Hero's Journey (Quest Completion)**: Build the child's dashboard for viewing and completing quests, including the parent's review and approval workflow.
* **Epic 4: The Treasury (Rewards System)**: Develop the reward store, points ledger, and the full redemption and fulfillment process.

---
## 6. Epic 1: The Adventure Begins (Foundation & User Setup)
* **Goal**: A new parent can sign up, create their family, and add their children, who can then log in. This establishes the foundational user structure of the app.
* **Story 1.1**: As a new Parent, I want to sign up and log in with my Google account so that I can easily and securely access the app.
    * **AC**:
        1.  The login page displays a "Sign in with Google" button.
        2.  Clicking the button initiates the Google OAuth flow.
        3.  Upon successful authentication, a new user account is created in the database.
        4.  The user is redirected to an initial "Create Family" screen.
* **Story 1.2**: As a new Parent, I want to create a "Family" group so that I can begin setting up our quests.
    * **AC**:
        1.  After first login, I am prompted to enter a Family Name.
        2.  Submitting the name creates a new Family record in the database, linked to my user account as the primary Quest Master.
        3.  I am then taken to the main "Quest Board" screen, which is initially empty.
* **Story 1.3**: As a Parent, I want to add a child to my family so they can participate in quests.
    * **AC**:
        1.  From a "Family" management screen, I can access an "Add Child" form.
        2.  The form requires a "Name" and has an optional "Email" field.
        3.  Submitting the form creates a new child user linked to my Family.
        4.  A unique, non-guessable permalink is generated and displayed for this child.
        5.  A button is available to easily copy the permalink to the clipboard.
* **Story 1.4**: As a Child, I want to log in using my special link so I can see my quests.
    * **AC**:
        1.  Visiting the generated permalink URL automatically logs the child in.
        2.  The child is taken directly to their "Today's Quest Log" dashboard.
        3.  A persistent session is created so they don't have to use the link every time on the same device.
* **Story 1.5**: As a user, I want to upload a profile photo so my family can see my picture in the app.
    * **AC**:
        1.  On my profile page, there is an option to upload an image.
        2.  I can select a JPG or PNG file from my device.
        3.  The uploaded image is displayed as my profile photo throughout the app.

---
## 7. Checklist Results Report
*(This section will be populated by the Product Owner after a thorough review of the completed PRD and other project artifacts.)*

---
## 8. Next Steps
### UX Expert Prompt
"Based on this PRD for 'Family Quests', please create a comprehensive UI/UX specification. Your focus should be on capturing the adventurous and fun theme for the child's experience, particularly the icon-driven 'Today's Quest Log'. For the parent, please design the efficient, single-view 'Quest Board' and 'Treasury' management interfaces."

### Architect Prompt
"Using this PRD for 'Family Quests', please design a full-stack architecture using Next.js and PostgreSQL. Key technical challenges to address are the real-time synchronization between parent and child views, a scalable database schema for families and recurring quests, and secure user authentication for both parents (Google) and children (permalink)."