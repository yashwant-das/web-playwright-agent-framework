import { Project, SyntaxKind, CallExpression } from 'ts-morph';

const project = new Project({ tsConfigFilePath: 'tsconfig.json' });
// According to package.json and eslintrc, page objects are in pages/**/*.ts
const pageObjects = project.getSourceFiles('pages/**/*.ts');

const violations: string[] = [];

function isLocatorCall(call: CallExpression): boolean {
    const expr = call.getExpression().getText();
    return expr.includes('.locator') || expr.includes('.getBy');
}

function isARIALocator(call: CallExpression): boolean {
    const expr = call.getExpression().getText();
    const validMethods = [
        'getByRole',
        'getByText',
        'getByLabel',
        'getByPlaceholder',
        'getByAltText',
        'getByTitle'
    ];
    return validMethods.some(method => expr.includes(`.${method}`));
}

for (const file of pageObjects) {
  file.getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter(isLocatorCall)
    .filter(call => !isARIALocator(call))
    .forEach(call => {
      violations.push(
        `${file.getFilePath()}:${call.getStartLineNumber()} — raw locator: ${call.getText()}`
      );
    });
}

if (violations.length > 0) {
  console.error('Selector health check failed. Raw locators (like page.locator) are FORBIDDEN in Page Objects.');
  console.error('Please use ARIA-first strategies (e.g. page.getByRole). Violations:');
  violations.forEach(v => console.error(`  ${v}`));
  process.exit(1);
}
