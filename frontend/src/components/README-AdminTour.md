# Admin Onboarding Tour

This document describes the implementation of the interactive onboarding tutorial for first-time admins using `react-joyride`.

## Components

### AdminTour Component

The `AdminTour` component (`AdminTour.tsx`) is responsible for displaying the interactive tour to new admin users. It uses the `react-joyride` library to create a step-by-step guided tour of the dashboard interface.

Key features:
- Automatically shows for first-time admins (controlled by `hasCompletedTour` flag in the database)
- Highlights key UI elements with tooltips and explanations
- Marks the tour as completed in the database when finished or skipped
- Customizable styling to match the application's design

## Implementation Details

### Frontend

1. **Dashboard Integration**:
   - The `Dashboard.tsx` component checks if the admin has completed the tour
   - If not, it renders the `AdminTour` component

2. **UI Elements**:
   - Key UI elements are marked with `data-tour` attributes:
     - `data-tour="sidebar"`: Navigation menu
     - `data-tour="dashboard-stats"`: Key metrics display
     - `data-tour="revenue-overview"`: Revenue tracking section
     - `data-tour="member-management"`: Member management section
     - `data-tour="add-member"`: Add member button

3. **Tour Completion**:
   - When the tour is completed or skipped, an API call is made to update the admin's profile

### Backend

1. **Admin Model**:
   - Added `hasCompletedTour` field (Boolean, default: false) to the Admin schema

2. **API Endpoint**:
   - Created `/admin/tour-completed` endpoint to mark the tour as completed
   - Implemented in `adminController.js` as `markTourCompleted` function

## Testing

A test script (`testAdminTour.js`) is provided to reset the tour status for testing purposes:

```
node src/scripts/testAdminTour.js <adminId>
```

## Usage

The tour will automatically appear for any admin user who has not completed it (i.e., `hasCompletedTour` is false). After the admin completes or skips the tour, the `hasCompletedTour` flag is set to true in the database, and the tour will not appear again.

To modify the tour steps or styling, edit the `AdminTour.tsx` component.
