from __future__ import absolute_import

from .base import BasePage


class GlobalSelectionPage(BasePage):
    def __init__(self, browser, client):
        super(GlobalSelectionPage, self).__init__(browser)
        self.client = client

    def get_selected_project_slug(self):
        return self.browser.element('[data-test-id="global-header-project-selector"]').text

    def get_selected_environment(self):
        return self.browser.element('[data-test-id="global-header-environment-selector"]').text

    def go_back_to_issues(self):
        self.browser.click('[data-test-id="back-to-issues"]')

    def open_project_selector(self):
        self.browser.click('[data-test-id="global-header-project-selector"]')

    def open_environment_selector(self):
        self.browser.click('[data-test-id="global-header-environment-selector"]')

    def select_project_by_slug(self, slug):
        project_item_selector = u'//*[@data-test-id="badge-display-name" and text()="{}"]'.format(
            slug
        )

        print(project_item_selector)
        self.open_project_selector()
        self.browser.wait_until(xpath=project_item_selector)
        self.browser.click(xpath=project_item_selector)
