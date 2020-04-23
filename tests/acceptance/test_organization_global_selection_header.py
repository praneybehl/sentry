from __future__ import absolute_import

from datetime import datetime
import six

import pytz
from django.utils import timezone

from sentry.testutils import AcceptanceTestCase, SnubaTestCase
from sentry.testutils.helpers.datetime import iso_format, before_now
from sentry.utils.compat.mock import patch

from tests.acceptance.page_objects.issue_list import IssueListPage
from tests.acceptance.page_objects.issue_details import IssueDetailsPage

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
        self.create_environment(name="dev", project=self.project_2)
        self.create_environment(name="prod", project=self.project_2)

        self.login_as(self.user)
        self.issues_list = IssueListPage(self.browser, self.client)
        self.issue_details = IssueDetailsPage(self.browser, self.client)

    def create_issues(self):
        self.issue_1 = self.store_event(
            data={
                "event_id": "a" * 32,
                "message": "oh no",
                "timestamp": iso_format(event_time),
                "fingerprint": ["group-1"],
            },
            project_id=self.project_1.id,
        )
        self.issue_2 = self.store_event(
            data={
                "event_id": "b" * 32,
                "message": "oh snap",
                "timestamp": iso_format(event_time),
                "fingerprint": ["group-2"],
                "environment": "prod",
            },
            project_id=self.project_2.id,
        )

    def test_global_selection_header_dropdown(self):
        self.project.update(first_event=timezone.now())
        self.issues_list.visit_issue_list(
            self.org.slug, query="?query=assigned%3Ame&project=" + six.text_type(self.project_1.id)
        )
        self.browser.wait_until_test_id("awaiting-events")

        self.browser.click('[data-test-id="global-header-project-selector"]')
        self.browser.snapshot("globalSelectionHeader - project selector")

        self.browser.click('[data-test-id="global-header-environment-selector"]')
        self.browser.snapshot("globalSelectionHeader - environment selector")

        self.browser.click('[data-test-id="global-header-timerange-selector"]')
        self.browser.snapshot("globalSelectionHeader - timerange selector")

    def test_global_selection_header_loads_with_correct_project(self):
        """
        Global Selection Header should:
        1) load project from URL if it exists
        2) enforce a single project if loading issues list with no project in URL
           a) last selected project via local storage if it exists
           b) otherwise need to just select first project
        """
        self.create_issues()
        # No project id in URL, selects first project
        self.issues_list.visit_issue_list(self.org.slug)
        assert u"project={}".format(self.project_1.id) in self.browser.current_url
        assert self.issues_list.global_selection.get_selected_project_slug() == self.project_1.slug

        # Uses project id in URL
        self.issues_list.visit_issue_list(
            self.org.slug, query=u"?project={}".format(self.project_2.id)
        )
        assert u"project={}".format(self.project_2.id) in self.browser.current_url
        assert self.issues_list.global_selection.get_selected_project_slug() == self.project_2.slug

        # reloads page with no project id in URL, selects first project
        self.issues_list.visit_issue_list(self.org.slug)
        assert u"project={}".format(self.project_1.id) in self.browser.current_url
        assert self.issues_list.global_selection.get_selected_project_slug() == self.project_1.slug

        # can select a different project
        self.issues_list.global_selection.select_project_by_slug(self.project_3.slug)
        self.issues_list.wait_until_loaded()
        assert u"project={}".format(self.project_3.id) in self.browser.current_url
        assert self.issues_list.global_selection.get_selected_project_slug() == self.project_3.slug

        # reloading page with no project id in URL after previously
        # selecting an explicit project should load previously selected project
        # from local storage
        # below is currently broken
        # TODO check environment as well
        # self.issues_list.visit_issue_list(
        #     self.org.slug
        # )
        # self.issues_list.wait_until_loaded()
        # print(self.browser.driver.execute_script( \
        #     "var ls = window.localStorage, items = {}; " \
        #     "for (var i = 0, k; i < ls.length; ++i) " \
        #     "  items[k = ls.key(i)] = ls.getItem(k); " \
        #     "return items; "))
        # print(self.project_1.id, self.project_2.id, self.project_3.id)
        # assert u"project={}".format(self.project_3.id) in self.browser.current_url

    @patch("django.utils.timezone.now")
    def test_issues_list_to_details_and_back_with_all_projects(self, mock_now):
        """
        If user has access to the `global-views` feature, which allows selecting multiple projects,
        they should be able to visit issues list with no project in URL and list issues
        for all projects they are members of.

        They should also be able to open an issue and then navigate back to still see
        "My Projects" in issues list.
        """
        with self.feature("organizations:global-views"):
            mock_now.return_value = datetime.utcnow().replace(tzinfo=pytz.utc)
            self.create_issues()
            self.issues_list.visit_issue_list(self.org.slug)
            self.issues_list.wait_for_issue()

            assert u"project=" not in self.browser.current_url
            assert self.issues_list.global_selection.get_selected_project_slug() == "My Projects"

            # select the issue
            self.issues_list.navigate_to_issue(1)

            # going back to issues list should not have the issue's project id in url
            self.issues_list.issue_details.go_back_to_issues()
            self.issues_list.wait_for_issue()

            # project id should remain *NOT* in URL
            assert u"project=" not in self.browser.current_url
            assert self.issues_list.global_selection.get_selected_project_slug() == "My Projects"

    @patch("django.utils.timezone.now")
    def test_issues_list_to_details_and_back_with_initial_project(self, mock_now):
        """
        If user has a project defined in URL, if they visit an issue and then
        return back to issues list, that project id should still exist in URL
        """
        mock_now.return_value = datetime.utcnow().replace(tzinfo=pytz.utc)
        self.create_issues()
        self.issues_list.visit_issue_list(
            self.org.slug, query=u"?project={}".format(self.project_2.id)
        )
        self.issues_list.wait_for_issue()

        assert u"project={}".format(self.project_2.id) in self.browser.current_url
        assert self.issues_list.global_selection.get_selected_project_slug() == self.project_2.slug

        # select the issue
        self.issues_list.navigate_to_issue(1)

        # project id should remain in URL
        assert u"project={}".format(self.project_2.id) in self.browser.current_url

        # going back to issues list should keep project in URL
        self.issues_list.issue_details.go_back_to_issues()
        self.issues_list.wait_for_issue()

        # project id should remain in URL
        assert u"project={}".format(self.project_2.id) in self.browser.current_url

    @patch("django.utils.timezone.now")
    def test_issue_details_to_stream_with_initial_env_no_project(self, mock_now):
        """
        Visiting issue details directly with no project but with an environment defined in URL.
        When navigating back to issues stream, should keep environment and project in context.
        """

        mock_now.return_value = datetime.utcnow().replace(tzinfo=pytz.utc)
        self.create_issues()
        self.issue_details.visit_issue_in_environment(self.org.slug, self.issue_2.group.id, "prod")

        # Make sure issue's project is in URL and in header
        assert u"project={}".format(self.project_2.id) in self.browser.current_url
        assert self.issues_list.global_selection.get_selected_project_slug() == self.project_2.slug

        # environment should be in URL and header
        assert u"environment=prod" in self.browser.current_url
        assert self.issue_details.global_selection.get_selected_environment() == "prod"

        # going back to issues list should keep project and environment in URL
        self.issue_details.go_back_to_issues()
        self.issues_list.wait_for_issue()

        # project id should remain in URL
        assert u"project={}".format(self.project_2.id) in self.browser.current_url
        assert u"environment=prod" in self.browser.current_url
        assert self.issues_list.global_selection.get_selected_project_slug() == self.project_2.slug
        assert self.issue_details.global_selection.get_selected_environment() == "prod"

    @patch("django.utils.timezone.now")
    def test_issue_details_to_stream_with_initial_env_no_project_with_multi_project_feature(
        self, mock_now
    ):
        """
        Visiting issue details directly with no project but with an environment defined in URL.
        When navigating back to issues stream, should keep environment and project in context.
        """

        with self.feature("organizations:global-views"):
            mock_now.return_value = datetime.utcnow().replace(tzinfo=pytz.utc)
            self.create_issues()
            self.issue_details.visit_issue_in_environment(
                self.org.slug, self.issue_2.group.id, "prod"
            )

            # Make sure issue's project is in URL and in header
            assert u"project={}".format(self.project_2.id) in self.browser.current_url
            assert (
                self.issues_list.global_selection.get_selected_project_slug() == self.project_2.slug
            )

            # environment should be in URL and header
            assert u"environment=prod" in self.browser.current_url
            assert self.issue_details.global_selection.get_selected_environment() == "prod"

            # can change environment so that when you navigate back to issues stream,
            # it keeps environment as selected

            # going back to issues list should keep project and environment in URL
            self.issue_details.go_back_to_issues()
            self.issues_list.wait_for_issue()

            # project id should remain in URL
            assert u"project={}".format(self.project_2.id) in self.browser.current_url
            assert u"environment=prod" in self.browser.current_url
            assert (
                self.issues_list.global_selection.get_selected_project_slug() == self.project_2.slug
            )
            assert self.issue_details.global_selection.get_selected_environment() == "prod"
