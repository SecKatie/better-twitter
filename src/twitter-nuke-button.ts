declare function GM_addStyle(css: string): void;
declare const css: string;
declare const missleSvg: string;

(() => {
    'use strict';

    GM_addStyle(css);

    const twitterStatusUrlRegex = /https:\/\/twitter\.com\/\w+\/status\/\d+/;

    // Helper function to wait for an element to appear
    const waitForElement = async <T extends Element>(selector: string, timeout = 10000): Promise<T | null> => {
        const element = document.querySelector(selector);
        if (element) {
            return element as T;
        }

        return new Promise<T | null>((resolve, reject) => {
            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element as T);
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Timed out waiting for the element: ${selector}`));
            }, timeout);
        });
    };

    // Block the author of a tweet
    const blockTweetAuthor = async (tweet: HTMLElement) => {
        const caretElement = tweet.querySelector<HTMLElement>('[data-testid="caret"]');
        if (caretElement) {
            caretElement.click();
            const blockButton = await waitForElement<HTMLElement>('[data-testid="block"]');
            if (blockButton) {
                blockButton.click();
                console.log("Clicked on the block button!");
                const blockConfirmationButton = await waitForElement<HTMLElement>('[data-testid="confirmationSheetConfirm"]');
                if (blockConfirmationButton) {
                    blockConfirmationButton.click();
                    console.log("Clicked on the block confirmation button!");
                }
            }
        }
    };

    // Add a "Nuke" button to each tweet
    const addNukeButtonToTweet = (tweet: HTMLElement) => {
        const statusLink = tweet.querySelector('a[href*="/status/"]');

        if (statusLink && !tweet.querySelector('.button-container')) {
            const buttonContainerDiv = document.createElement('div');
            const buttonVerticalCenterDiv = document.createElement('div');
            const buttonDiv = document.createElement('div');
            const buttonIconDiv = document.createElement('div');
            const buttonIconSizeDiv = document.createElement('div');
            const buttonTextDiv = document.createElement('div');
            const buttonTextLabelOuter = document.createElement('span');
            const buttonTextLabel = document.createElement('span');
            const buttonTextLabelInner = document.createElement('span');

            // Set the styles
            buttonContainerDiv.className = 'button-container';
            buttonVerticalCenterDiv.className = 'button-vcenter';
            buttonDiv.className = 'button';
            buttonIconDiv.className = 'button-icon';
            buttonIconSizeDiv.className = 'button-icon-size';
            buttonTextDiv.className = 'button-text';
            buttonTextLabelOuter.className = 'button-text-label-outer';
            buttonTextLabel.className = 'button-text-label';
            buttonTextLabelInner.className = 'button-text-label-inner';

            // Set the text
            buttonTextLabelInner.innerText = 'Block';

            // Add the icon
            buttonIconDiv.innerHTML = missleSvg;

            // Create the hierarchy
            buttonContainerDiv.appendChild(buttonVerticalCenterDiv);
            buttonVerticalCenterDiv.appendChild(buttonDiv);
            buttonDiv.appendChild(buttonIconDiv);
            buttonDiv.appendChild(buttonTextDiv);
            buttonIconDiv.insertBefore(buttonIconSizeDiv, buttonIconDiv.firstChild);
            buttonTextDiv.appendChild(buttonTextLabelOuter);
            buttonTextLabelOuter.appendChild(buttonTextLabel);
            buttonTextLabel.appendChild(buttonTextLabelInner);

            // Set the click handler
            buttonContainerDiv.onclick = () => {
                blockTweetAuthor(tweet);
            };


            const actionBar = tweet.querySelector('[role="group"]');
            if (actionBar) {
                actionBar.insertBefore(buttonContainerDiv, actionBar.lastChild);
                // actionBar.appendChild(buttonContainerDiv);
            }
        }
    };

    const hideRepliesFromVerifiedUsers = () => {
        const tweets = document.querySelectorAll('[data-testid="tweet"]');
        let isFirstTweet = true;

        tweets.forEach((tweet) => {
            if (isFirstTweet) {
                isFirstTweet = false;
                return;
            }

            const author = tweet.querySelector('[data-testid="tweet"] [data-testid="User-Name"]');
            const verifiedBadge = author?.querySelector('[data-testid="icon-verified"]');
            if (verifiedBadge) {
                const tweetContainer = tweet.closest('[data-testid="cellInnerDiv"]');
                if (tweetContainer instanceof HTMLElement) {
                    tweetContainer.style.display = 'none';

                    // Hide the next element if it is a "Show replies" button
                    const nextElement = tweetContainer.nextElementSibling;
                    if (nextElement instanceof HTMLElement) {
                        const showReplies = nextElement.querySelector('[dir="ltr"]');
                        if (showReplies?.textContent === 'Show replies') {
                            nextElement.style.display = 'none';
                        }
                    }
                }
            }
        });
    };


    // Add "Nuke" buttons to all tweets on the page
    const addNukeButtonsToTweets = () => {
        const tweets = document.querySelectorAll('[data-testid="tweet"]');
        tweets.forEach((tweet) => addNukeButtonToTweet(tweet as HTMLElement));
    };

    const reactToUrlChange = () => {
        const currentUrl = window.location.href;

        if (twitterStatusUrlRegex.test(currentUrl)) {
            console.log("We are on a tweet page")
            replyObserver.observe(document.body, { childList: true, subtree: true });
            hideRepliesFromVerifiedUsers();
        } else {
            replyObserver.disconnect();
        }

        nukeButtonObserver.observe(document.body, { childList: true, subtree: true });
        addNukeButtonsToTweets();
    };

    const nukeButtonObserver = new MutationObserver(addNukeButtonsToTweets);
    const replyObserver = new MutationObserver(hideRepliesFromVerifiedUsers);

    const urlChangeObserver = new MutationObserver(reactToUrlChange);
    urlChangeObserver.observe(document.body, { childList: true, subtree: true });

    reactToUrlChange();
})();