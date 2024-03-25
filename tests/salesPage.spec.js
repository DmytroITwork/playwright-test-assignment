const { test, expect } = require('@playwright/test');

test.describe('Sales Page Tests', () => {
    let initialApiResponseData;
    let firstApiResponseData;

    test.beforeEach(async ({ page }) => {
        await page.goto('https://dev-admin.grace-technology.io/');
        await page.fill('#login_email', 'qa@grace-technology.io');
        await page.fill('#login_password', '123456');
        await page.click('button:has-text("Log in")');
        // Navigate to the Sales page
        await page.click('li[data-menu-id*="sales_dashboard"]');
        page.once('response', async (response) => {
            if (response.url().includes('monthly-sales-counts') && response.status() === 200) {
                firstApiResponseData = await response.json();
                console.log("First load API response captured:", firstApiResponseData);
            }
        });
    });

    test('Verify changing brand filter updates data and reverts correctly', async ({ page }) => {
        // Navigate to the Sales page and capture the initial API response
        await page.route('**/monthly-sales-counts', route => route.continue());
        const initialResponsePromise = page.waitForResponse(response => response.url().includes('monthly-sales-counts') && response.status() === 200);
        
        await page.click('li[data-menu-id*="sales_dashboard"]');
        initialApiResponseData = await initialResponsePromise.then(response => response.json());
        console.log("Initial API response captured:", initialApiResponseData);

        // Change the brand filter and verify a new API response is received that is not the same as the initial one
        await page.click('.ant-select-selector');
        const options = await page.$$('.ant-select-item');
        await options[1].click();

        const newApiResponsePromise = page.waitForResponse(response => response.url().includes('monthly-sales-counts') && response.status() === 200);
        const newApiResponseData = await newApiResponsePromise.then(response => response.json());
        console.log("New API response after brand filter change:", newApiResponseData);
        expect(newApiResponseData).not.toEqual(initialApiResponseData);

        // Go back to the previous page
        await page.goBack();

        // Verify the API response reverts to the initial
        const revertedApiResponsePromise = page.waitForResponse(response => response.url().includes('monthly-sales-counts') && response.status() === 200);
        const revertedApiResponseData = await revertedApiResponsePromise.then(response => response.json());
        console.log("Reverted API response after going back:", revertedApiResponseData);
        expect(revertedApiResponseData).toEqual(initialApiResponseData);
        console.log("API responses are equal as expected");
    });

    test('Verify changing year filter updates data and reverts correctly', async ({ page }) => {
        // Navigate to the Sales page and capture the initial API response
        await page.route('**/monthly-sales-counts', route => route.continue());
        const initialResponsePromise = page.waitForResponse(response => response.url().includes('monthly-sales-counts') && response.status() === 200);
        
        await page.click('li[data-menu-id*="sales_dashboard"]');
        initialApiResponseData = await initialResponsePromise.then(response => response.json());
        console.log("Initial API response captured:", initialApiResponseData);

        // Change the year filter and verify a new API response is received that is not the same as the initial one
        await page.click('span.ant-select-selection-item[title="2024"]');
        await page.click('.ant-select-item-option:first-child');

        const newApiResponsePromise = page.waitForResponse(response => response.url().includes('monthly-sales-counts') && response.status() === 200);
        const newApiResponseData = await newApiResponsePromise.then(response => response.json());
        console.log("New API response after year filter change:", newApiResponseData);
        expect(newApiResponseData).not.toEqual(initialApiResponseData);

        // Go back to the previous page
        await page.goBack();

        // Verify the API response reverts to the initial
        const revertedApiResponsePromise = page.waitForResponse(response => response.url().includes('monthly-sales-counts') && response.status() === 200);
        const revertedApiResponseData = await revertedApiResponsePromise.then(response => response.json());
        console.log("Reverted API response after going back:", revertedApiResponseData);
        expect(revertedApiResponseData).toEqual(initialApiResponseData);
        console.log("API responses are equal as expected");
    });

    test('Apply filters and verify after reload', async ({ page }) => {
        // Apply brand filter 
        await page.click('.ant-select-selector');
        await page.click('div.ant-select-item-option[title="Pi"]');

        // Apply year filter
        await page.click('span.ant-select-selection-item[title="2024"]');
        await page.click('div.ant-select-item-option[title="2023"]');

        // Intercept the API response to store the monthly-sales-counts
        const beforeReloadApiResponsePromise = page.waitForResponse(response => response.url().includes('monthly-sales-counts') && response.status() === 200);
        const beforeReloadApiResponseData = await beforeReloadApiResponsePromise.then(response => response.json());
        console.log("API response before page reload", beforeReloadApiResponseData);

        await page.reload(); // page reload

        // Compare actual API responses from monthly-sales-counts with the stored one
        const afterReloadApiResponsePromise = page.waitForResponse(response => response.url().includes('monthly-sales-counts') && response.status() === 200);
        const afterReloadApiResponseData = await afterReloadApiResponsePromise.then(response => response.json());
        console.log("API response after page reload", afterReloadApiResponseData);
        expect(afterReloadApiResponseData).toEqual(beforeReloadApiResponseData);
        console.log("API responses are equal as expected");

        //Ensure the brand filter selector contains the "Pi" title
        await page.waitForSelector('span.ant-select-selection-item[title="Pi"]');
        const brandTitle = await page.getAttribute('span.ant-select-selection-item', 'title');
        expect(brandTitle).toBe('Pi');

        // Ensure the year filter contains the "2023" title
        await page.waitForSelector('span.ant-select-selection-item[title="2023"]');
        const yearTitle = await page.getAttribute('span.ant-select-selection-item[title="2023"]', 'title');
        expect(yearTitle).toBe('2023');
    });
});