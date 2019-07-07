browser.runtime.onMessage.addListener(async message =>  {
    let tabs = await browser.tabs.query({
        currentWindow: true,
        active: true});
    browser.tabs.create({
        url: message.url,
        index: tabs[0].index + 1,
        cookieStoreId: "firefox-default"
    });
});
