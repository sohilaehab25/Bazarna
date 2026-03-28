# Cute Bazar 🛒💕

A feminine, soft, and cozy web application for a handmade bazaar, built with Angular.

## Features

- 🏠 Home page with featured categories
- 🛍️ Product catalog with handmade items
- 🛒 Shopping cart functionality
- 👤 User profile management
- 📱 Responsive design with soft, feminine styling

## Design System

- **Colors**: Pink (#FFB6C1), Beige (#F5E6D8), Brown (#8B4513), Tan (#D4A574)
- **Typography**: Poppins (main), Dancing Script (decorative)
- **UI**: Rounded corners (25px), soft shadows, emoji icons
- **Animations**: Smooth 0.3s ease transitions

## Architecture

- Angular 21+ with standalone components
- Smart/Dumb component separation
- Reusable component library
- Signals for state management
- API-ready services

## Development

### Prerequisites

- Node.js 20+
- Angular CLI 21+

### Installation

```bash
npm install
```

### Development Server

```bash
ng serve
```

Navigate to `http://localhost:4200/`.

### Build

```bash
ng build
```

### Running Tests

```bash
ng test
```

### Linting

```bash
ng lint
```

## Project Structure

```
src/
├── app/
│   ├── features/          # Feature modules
│   │   ├── home/
│   │   ├── products/
│   │   ├── cart/
│   │   └── profile/
│   ├── shared/
│   │   ├── components/    # Reusable components
│   │   └── services/      # API services
│   ├── app.ts             # Root component
│   ├── app.html
│   ├── app.scss
│   ├── app.config.ts
│   └── app.routes.ts
└── styles.scss            # Global styles
```
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
