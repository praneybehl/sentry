from __future__ import absolute_import

from datetime import datetime
import six

import pytz
from django.utils import timezone

from sentry.testutils import AcceptanceTestCase, SnubaTestCase
from sentry.testutils.helpers.datetime import iso_format, before_now
from sentry.utils.compat.mock import patch

from tests.acceptance.page_objects.issue_list import IssueListPage

event_time = before_now(days=3).replace(tzinfo=pytz.utc)


class OrganizationGlobalHeaderTest(AcceptanceTestCase, SnubaTestCase):
    def setUp(self):
        super(OrganizationGlobalHeaderTest, self).setUp()
        self.user = self.create_user("foo@example.com")
        self.org = self.create_organization(owner=self.user, name="Rowdy Tiger")
        self.team = self.create_team(
            organization=self.org, name="Mariachi Band", members=[self.user]
        )

        self.project_1 = self.create_project(
            organization=self.org, teams=[self.team], name="Bengal"
        )
        self.project_2 = self.create_project(
            organization=self.org, teams=[self.team], name="Sumatra"
        )
        self.project_3 = self.create_project(
            organization=self.org, teams=[self.team], name="Siberian"
        )

        self.create_environment(name="development", project=self.project_1)
        self.create_environment(name="production", project=self.project_1)

        self.login_as(self.user)
        self.page = IssueListPage(self.browser, self.client)

    def create_issues(self):
        self.store_event(
            data={
                "event_id": "a" * 32,
                "message": "oh no",
                "timestamp": iso_format(event_time),
                "fingerprint": ["group-1"],
            },
            project_id=self.project_1.id,
        )
        self.store_event(
            data={
                "event_id": "b" * 32,
                "message": "oh snap",
                "timestamp": iso_format(event_time),
                "fingerprint": ["group-2"],
            },
            project_id=self.project_2.id,
        )

    def test_global_selection_header_dropdown(self):
        self.project.update(first_event=timezone.now())
        self.page.visit_issue_list(
            self.org.slug, query="?query=assigned%3Ame&project=" + six.text_type(self.project_1.id)
        )
        self.browser.wait_until_test_id("awaiting-events")

        self.browser.click('[data-test-id="global-header-project-selector"]')
        self.browser.snapshot("globalSelectionHeader - project selector")

        self.browser.click('[data-test-id="global-header-environment-selector"]')
        self.browser.snapshot("globalSelectionHeader - environment selector")

        self.browser.click('[data-test-id="global-header-timerange-selector"]')
        self.browser.snapshot("globalSelectionHeader - timerange selector")


    def test_global_selection_header_no_project(self):
        self.page.visit_issue_list(
            self.org.slug, query=""
        )

        assert self.browser.element('[data-test-id="global-header-project-selector"]').text == 'bengal'


    @patch("django.utils.timezone.now")
    def test_issues_list_no_project(self, mock_now):
        mock_now.return_value = datetime.utcnow().replace(tzinfo=pytz.utc)
        self.create_issues()
        self.page.visit_issue_list(
            self.org.slug, query=""
        )

        assert self.browser.element('[data-test-id="global-header-project-selector"]').text == 'bengal'
