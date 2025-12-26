---
description: Comprehensive code review for quality and best practices
---

Perform a comprehensive code review of recent changes, checking for:

1. **TypeScript Type Safety**
   - Proper type annotations
   - No use of `any` types
   - Correct interface/type usage

2. **React Best Practices**
   - Proper hook usage (dependencies, rules of hooks)
   - Component composition
   - Performance considerations (unnecessary re-renders)
   - Proper key props in lists

3. **Accessibility (a11y)**
   - Semantic HTML
   - ARIA labels where needed
   - Keyboard navigation support
   - Color contrast

4. **Security**
   - No XSS vulnerabilities
   - Safe data handling
   - Proper input validation

5. **Code Quality**
   - Clear naming conventions
   - Proper error handling
   - Code duplication
   - Comments where needed

6. **Performance**
   - Unnecessary re-renders
   - Large bundle size concerns
   - Inefficient algorithms

Provide a summary of findings with specific file locations and recommendations for improvements.
