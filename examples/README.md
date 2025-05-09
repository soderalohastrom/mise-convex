# Mise Frontend Examples

This directory contains example React components that demonstrate how to use the Mise API with Convex functions.

## Components

### TalentProfileForm

A comprehensive form for talent (hospitality workers) to create and update their profiles. Demonstrates:

- Fetching user profile data
- Form state management
- Multi-select field handling
- Complex availability scheduling with a table UI
- Multiple skill categories
- Form submission with error handling

Usage:
```jsx
import TalentProfileForm from './TalentProfileForm';

function App() {
  return (
    <div>
      <TalentProfileForm />
    </div>
  );
}
```

### JobPostingForm

A form for teams (restaurants/businesses) to create job postings. Demonstrates:

- Team selection
- Position and compensation type configuration
- Required skills selection based on position type (BOH/FOH)
- Shift scheduling with a table UI
- Form validation and error handling

Usage:
```jsx
import JobPostingForm from './JobPostingForm';

function App() {
  return (
    <div>
      <JobPostingForm />
    </div>
  );
}
```

### ApplicationsDashboard

A dashboard to view and manage job applications from both talent and team perspectives. Demonstrates:

- Tab-based UI for different views
- Team selection dropdown
- Application status management
- Responsive tables for application data
- Card-based UI for job postings

Usage:
```jsx
import ApplicationsDashboard from './ApplicationsDashboard';

function App() {
  return (
    <div>
      <ApplicationsDashboard />
    </div>
  );
}
```

### JobSearch

A search interface for talents to find and apply to job postings. Demonstrates:

- Search filters with multiple criteria
- Card-based job listings
- Modal dialog for detailed job view
- Application submission
- Responsive grid layout

Usage:
```jsx
import JobSearch from './JobSearch';

function App() {
  return (
    <div>
      <JobSearch />
    </div>
  );
}
```

## Integration with Your Application

These components are designed to work with the Convex backend defined in the `/convex` directory. To integrate them:

1. Set up Convex in your React application following the [Convex documentation](https://docs.convex.dev/quickstart/react)

2. Set up Clerk for authentication following the [Clerk documentation](https://clerk.com/docs/quickstarts/nextjs)

3. Import and use these components in your application

4. Customize the UI styling to match your application's design system

## Prerequisites

- React 18+
- Convex client set up with the Mise schema
- Clerk for authentication
- TailwindCSS for styling (or adapt the className props to your preferred CSS solution)

## Styling

These examples use TailwindCSS for styling. If you're using a different styling solution, you'll need to adapt the `className` props accordingly.
