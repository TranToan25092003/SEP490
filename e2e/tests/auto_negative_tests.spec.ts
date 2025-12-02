import { test, expect, type Page } from '@playwright/test';
import {
  getNegativeCasesForField,
  getPositiveCasesForField,
  type FieldConfig,
} from './utils/test-data-generators';
import path from 'node:path';

import * as formsToTest from './utils/forms';

const TEST_FILES_DIR = path.join(__dirname, 'test-files');

export interface FieldDef {
  name: string;
  selector: string;
  config: FieldConfig;
  testFilePath?: string;
}

export interface FormDef {
  name: string;
  url: string;
  preSteps?: (page: Page) => Promise<void>;
  fields: FieldDef[];
  submitButton: string;
  requiresLogin?: boolean;
}


async function fillFieldWithPositiveValue(page: Page, field: FieldDef): Promise<void> {
  const input = page.locator(field.selector);

  if (field.config.fieldType === 'file') {
    if (field.testFilePath) {
      await input.setInputFiles(field.testFilePath);
    }
    return;
  }

  const positiveCases = getPositiveCasesForField(field.config);
  if (positiveCases.length > 0) {
    await input.clear();
    await input.fill(String(positiveCases[0].value));
  }
}

async function fillOtherFieldsWithPositiveValues(
  page: Page,
  allFields: FieldDef[],
  targetFieldName: string
): Promise<void> {
  for (const field of allFields) {
    if (field.name !== targetFieldName) {
      await fillFieldWithPositiveValue(page, field);
    }
  }
}

const forms: FormDef[] = [
  formsToTest.BannerForm
];

for (const form of forms) {
  test.describe(`Negative Tests for ${form.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(form.url);
      await page.waitForLoadState('networkidle');
      if (form.preSteps) {
        await form.preSteps(page);
      }
    });

    for (const field of form.fields) {
      const negativeCases = getNegativeCasesForField(field.config);

      for (const testCase of negativeCases) {
        test(`${field.name} - ${testCase.description}`, async ({ page }) => {
          await fillOtherFieldsWithPositiveValues(page, form.fields, field.name);
          const input = page.locator(field.selector);

          if (field.config.fieldType === 'file') {
            console.log(`Testing file input with case: ${testCase.value}`);
            if (testCase.name === 'no_file_selected' || testCase.value === '') {
              await input.setInputFiles([]);
            } else if (testCase.value) {
              const testFilePath = path.join(TEST_FILES_DIR, String(testCase.value));
              try {
                await input.setInputFiles(testFilePath);
              } catch {
                test.skip();
                return;
              }
            }
          } else {
            await expect(input).toBeVisible();
            await input.clear();
            if (testCase.value !== null && testCase.value !== undefined) {
              await input.pressSequentially(String(testCase.value));
            }
            await input.blur();
          }

          let requestSent = false;
          page.on('request', (request) => {
            if (request.method() === 'POST' || request.method() === 'PUT' || request.method() === 'PATCH') {
              requestSent = true;
            }
          });

          const submitBtn = page.locator(form.submitButton);
          if (await submitBtn.isVisible()) {
            await submitBtn.click();
          }

          await page.waitForTimeout(2000);

          expect(requestSent).toBe(false);
        });
      }
    }
  });
}
