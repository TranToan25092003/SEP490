import type { FormDef } from "../auto_negative_tests.spec";
import path from 'node:path';

const TEST_FILES_DIR = path.join(__dirname, '../test-files');

export const BannerForm: FormDef = {
  name: 'Create Banner',
  url: '/admin/banners',
  preSteps: async (page) => {
      await page.getByRole('button', { name: '+ Thêm banner' }).click();
  },
  requiredFields: [
    {
      name: 'title',
      selector: 'input[name="title"]',
      config: { fieldType: 'text', required: true, minLength: 5, maxLength: 100 }
    },
    {
      name: 'image',
      selector: 'input[type="file"]',
      config: { fieldType: 'file', required: true, acceptedFileTypes: ['image/jpeg', 'image/png'] },
      testFilePath: path.join(TEST_FILES_DIR, 'valid_image.jpg')
    },
    {
      name: 'link_url',
      selector: 'input[name="link_url"]',
      config: { fieldType: 'text', required: true }
    },
    {
      name: 'display_order',
      selector: 'input[name="display_order"]',
      config: { fieldType: 'number', required: true, min: 1, max: 100 }
    }
  ],
  submitButton: 'button:has-text("Tạo mới")'
};

export const ServiceOrderAddForm: FormDef = {
  name: 'Create Service Order',
  url: '/staff/service-order/add',
  preSteps: async (page) => {
    await page.waitForLoadState('networkidle');
    // Select the first service checkbox to satisfy the "at least one service" requirement
    const firstCheckbox = page.locator('button[role="checkbox"]').first();
    if (await firstCheckbox.count() > 0) {
      await firstCheckbox.click();
    }
  },
  requiredFields: [
    {
      name: 'customerName',
      selector: 'input[name="customerName"]',
      config: { fieldType: 'text', required: true, minLength: 1, maxLength: 50 }
    },
    {
      name: 'phone',
      selector: 'input[name="phone"]',
      config: { fieldType: 'phone', required: true }
    },
    {
      name: 'licensePlate',
      selector: 'input[name="licensePlate"]',
      config: { fieldType: 'licensePlate', required: true }
    },
    {
      name: 'address',
      selector: 'input[name="address"]',
      config: { fieldType: 'text', required: false, maxLength: 100 }
    },
    {
      name: 'note',
      selector: 'textarea[name="note"]',
      config: { fieldType: 'textarea', required: false, maxLength: 500 }
    }
  ],
  submitButton: 'button[type="submit"]'
};

export const ServiceOrderEditForm: FormDef = {
  name: 'Edit Service Order',
  url: '/staff/service-order/692d7255d90e2892606b78b4',
  preSteps: async (page) => {
    await page.waitForLoadState('networkidle');

    // Ensure we are on services tab
    const serviceTab = page.getByRole('tab', { name: /dịch vụ/i });
    if (await serviceTab.isVisible()) {
      await serviceTab.click();
    }

    // Check if there are any service rows
    const rows = page.locator('input[name^="services"][name$=".name"]');
    if (await rows.count() === 0) {
       await page.getByRole('button', { name: /thêm dịch vụ trống/i }).click();
    }
  },
  requiredFields: [
    {
      name: 'serviceName',
      selector: 'input[name="services.0.name"]',
      config: { fieldType: 'text', required: true, minLength: 1, maxLength: 512 }
    },
    {
      name: 'servicePrice',
      selector: 'input[id="services.0.price"]',
      config: { fieldType: 'price', required: true, min: 0 }
    },
    {
      name: 'serviceQuantity',
      selector: 'input[name="services.0.quantity"]',
      config: { fieldType: 'number', required: true, min: 1 }
    }
  ],
  submitButton: 'button:has-text("Cập nhật thông tin")'
};
