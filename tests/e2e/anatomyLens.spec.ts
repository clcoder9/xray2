import { expect, test } from '@playwright/test';

const screenshotDir = (
  globalThis as { process?: { env?: Record<string, string | undefined> } }
).process?.env?.SCREENSHOT_DIR;

test.describe('Anatomy Lens E2E (Still-Image Dev Input Mode)', () => {
  test('renders still-image X-ray lens, switches bone/muscle, changes language, drags focus circle, and detects posterior view with zero external requests', async ({
    page
  }) => {
    const externalRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (
        !url.startsWith('http://127.0.0.1') &&
        !url.startsWith('http://localhost') &&
        !url.startsWith('data:') &&
        !url.startsWith('blob:')
      ) {
        externalRequests.push(url);
      }
    });

    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto('/?devInput=anterior');

    const canvas = page.getByTestId('lens-canvas');
    await expect(canvas).toBeVisible();

    const cloud = page.getByTestId('speech-cloud');
    await expect(cloud).toBeVisible();
    await expect(cloud).toHaveAttribute('data-structure-type', 'muscle');

    if (screenshotDir) {
      await page.screenshot({ path: `${screenshotDir}/anterior-muscles.png` });
    }

    // Speech cloud shows primary name, secondary names, and description
    const initialTitle = await cloud.locator('.speech-cloud__title').textContent();
    expect(initialTitle?.trim().length).toBeGreaterThan(2);
    await expect(cloud.locator('.speech-cloud__subnames')).toContainText('DE');
    await expect(cloud.locator('.speech-cloud__subnames')).toContainText('LA');
    await expect(cloud.locator('.speech-cloud__desc')).toBeVisible();

    // 1-tap toggle to Skeleton (bones)
    await page.getByTestId('toggle-layer-btn').click();
    await expect(cloud).toHaveAttribute('data-structure-type', 'bone');

    if (screenshotDir) {
      await page.screenshot({ path: `${screenshotDir}/anterior-bones.png` });
    }

    // Toggle back to Muscles
    await page.getByTestId('toggle-layer-btn').click();
    await expect(cloud).toHaveAttribute('data-structure-type', 'muscle');

    // Cycle language EN -> DE -> LA
    await page.getByTestId('cycle-lang-btn').click();
    await expect(page.getByTestId('cycle-lang-btn')).toContainText('DE');
    await expect(cloud.locator('.speech-cloud__title')).toHaveAttribute('lang', 'de');

    await page.getByTestId('cycle-lang-btn').click();
    await expect(page.getByTestId('cycle-lang-btn')).toContainText('LA');
    await expect(cloud.locator('.speech-cloud__title')).toHaveAttribute('lang', 'la');

    // Switch back to EN
    await page.getByTestId('cycle-lang-btn').click();
    await expect(page.getByTestId('cycle-lang-btn')).toContainText('EN');

    // Drag focus circle down toward the thigh/quadriceps region
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    const startX = box!.x + box!.width * 0.5;
    const startY = box!.y + box!.height * 0.44;
    const targetX = box!.x + box!.width * 0.42;
    const targetY = box!.y + box!.height * 0.62;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(targetX, targetY, { steps: 12 });
    await page.mouse.up();

    // Verify focused structure updated after dragging onto the lower body
    await expect(cloud).toHaveAttribute('data-structure-id', /m_rectus_femoris|m_vastus_|m_sartorius|m_adductor|m_gluteus|m_tensor/);

    // Switch Dev Input to posterior view and verify automatic back detection
    await page.getByTestId('settings-btn').click();
    await page.getByTestId('dev-sample-posterior').click();

    await expect(page.getByTestId('cycle-view-btn')).toContainText('Back');
    await expect(cloud).toHaveAttribute(
      'data-structure-id',
      /m_popliteus|m_biceps_femoris|m_semitendinosus|m_gastrocnemius/
    );

    // Reset lens to center via keyboard handle Enter and verify posterior back muscles
    await page.getByTestId('lens-kbd-handle').focus();
    await page.keyboard.press('Enter');

    await expect(cloud).toHaveAttribute(
      'data-structure-id',
      /m_trapezius|m_latissimus|m_erector|m_infraspinatus|m_rhomboideus|m_fascia_thoracolumbalis/
    );

    if (screenshotDir) {
      await page.screenshot({ path: `${screenshotDir}/posterior-muscles.png` });
    }

    // Confirm zero external network requests were ever made
    expect(externalRequests).toEqual([]);
  });

  test('focuses scaled facial muscles when moving the focus circle onto the head', async ({
    page
  }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto('/?devInput=anterior');

    const canvas = page.getByTestId('lens-canvas');
    await expect(canvas).toBeVisible();
    const cloud = page.getByTestId('speech-cloud');
    await expect(cloud).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Drag focus circle from default center (0.5, 0.44) up to face center (0.5, 0.25)
    const startX = box!.x + box!.width * 0.5;
    const startY = box!.y + box!.height * 0.44;
    const headX = box!.x + box!.width * 0.5;
    const headY = box!.y + box!.height * 0.25;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(headX, headY, { steps: 12 });
    await page.mouse.up();

    await expect(cloud).toHaveAttribute(
      'data-structure-id',
      /m_frontalis|m_orbicularis_oculi|m_temporalis|m_masseter|m_zygomaticus_major|m_orbicularis_oris/
    );

    if (screenshotDir) {
      await page.screenshot({ path: `${screenshotDir}/head-muscles.png` });
    }
  });
});
