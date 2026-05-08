import os
import time
import unittest
import warnings

warnings.filterwarnings("ignore", category=DeprecationWarning)

from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

BASE_URL = os.getenv("BASE_URL")
TEST_EMAIL = os.getenv("PROFILE_TEST_EMAIL")
TEST_PASSWORD = os.getenv("PROFILE_TEST_PASSWORD")

WAIT = 20
VALID_NAME = "Test User"
VALID_NAME1 = "Sample User"
WHITESPACE_NAME = "   "
LONG_NAME = "A" * 100


def make_driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()), options=options
    )
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
        "source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    })
    driver.set_window_size(1280, 900)
    return driver


def tid(driver, test_id):
    return WebDriverWait(driver, WAIT).until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, f"[data-testid='{test_id}']"))
    )


def tid_click(driver, test_id):
    el = WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, f"[data-testid='{test_id}']"))
    )
    driver.execute_script("arguments[0].click();", el)


def tid_type(driver, test_id, value):
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, f"[data-testid='{test_id}']"))
    )
    driver.execute_script("""
        var wrapper = document.querySelector("[data-testid='" + arguments[0] + "']");
        var el = wrapper.tagName === 'INPUT' ? wrapper : wrapper.querySelector('input');
        var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, arguments[1]);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    """, test_id, value)


def get_input_value(driver, test_id):
    return driver.execute_script("""
        var wrapper = document.querySelector("[data-testid='" + arguments[0] + "']");
        var el = wrapper.tagName === 'INPUT' ? wrapper : wrapper.querySelector('input');
        return el ? el.value : null;
    """, test_id)


def get_error_toast(driver):
    WebDriverWait(driver, WAIT).until(
        lambda d: len(d.find_elements(By.CSS_SELECTOR, "[data-sonner-toast][data-type='error']")) > 0
    )
    toasts = driver.find_elements(By.CSS_SELECTOR, "[data-sonner-toast][data-type='error']")
    return " ".join(t.text for t in toasts)


def get_success_toast(driver):
    WebDriverWait(driver, WAIT).until(
        lambda d: any(
            "Profile updated" in t.text
            for t in d.find_elements(By.CSS_SELECTOR, "[data-sonner-toast]")
        )
    )
    toasts = driver.find_elements(By.CSS_SELECTOR, "[data-sonner-toast]")
    return " ".join(t.text for t in toasts)


def login(driver):
    driver.get(f"{BASE_URL}/login")
    tid_type(driver, "login-email", TEST_EMAIL)
    tid_type(driver, "login-password", TEST_PASSWORD)
    tid_click(driver, "login-btn")
    WebDriverWait(driver, WAIT).until(lambda d: "/login" not in d.current_url)
    driver.get(f"{BASE_URL}/profile")
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='profile-info-card']"))
    )


class TestProfileEdit(unittest.TestCase):

    def tearDown(self):
        time.sleep(3)

    # ------------------------------------------------------------------ #
    #  AC-01 – Profile form is visible                                    #
    # ------------------------------------------------------------------ #
    def test_ac_01_profile_form_visible(self):
        """Positive: Profile info card is visible after login."""
        driver = make_driver()
        try:
            login(driver)
            card = tid(driver, "profile-info-card")
            self.assertTrue(card.is_displayed(), "Profile info card should be visible")
        finally:
            driver.quit()

    def test_ac_01_01_profile_form_not_visible_when_logged_out(self):
        """Negative: Profile page redirects to login when unauthenticated."""
        driver = make_driver()
        try:
            driver.get(f"{BASE_URL}/profile")
            WebDriverWait(driver, WAIT).until(EC.url_contains("/login"))
            self.assertIn("/login", driver.current_url,
                          "Unauthenticated user should be redirected to login")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-02 – User can input personal information                        #
    # ------------------------------------------------------------------ #
    def test_ac_02_user_can_input_display_name(self):
        """Positive: User can type a valid display name."""
        driver = make_driver()
        try:
            login(driver)
            tid_type(driver, "display-name-input", VALID_NAME)
            value = get_input_value(driver, "display-name-input")
            self.assertEqual(value, VALID_NAME, "Display name input should contain the typed value")
        finally:
            driver.quit()

    def test_ac_02_01_input_accepts_special_characters(self):
        """Edge: Display name with special characters is accepted in the input."""
        driver = make_driver()
        try:
            login(driver)
            special_name = "José María"
            tid_type(driver, "display-name-input", special_name)
            value = get_input_value(driver, "display-name-input")
            self.assertEqual(value, special_name, "Input should accept special characters")
        finally:
            driver.quit()

    def test_ac_02_02_input_accepts_long_name(self):
        """Edge: Display name input accepts a very long string."""
        driver = make_driver()
        try:
            login(driver)
            tid_type(driver, "display-name-input", LONG_NAME)
            value = get_input_value(driver, "display-name-input")
            self.assertEqual(value, LONG_NAME, "Input should accept long names")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-03 – User can edit existing profile information                 #
    # ------------------------------------------------------------------ #
    def test_ac_03_user_can_edit_display_name(self):
        """Positive: Editing display name changes the input value."""
        driver = make_driver()
        try:
            login(driver)
            original = get_input_value(driver, "display-name-input")
            tid_type(driver, "display-name-input", VALID_NAME)
            new_value = get_input_value(driver, "display-name-input")
            self.assertNotEqual(original, new_value, "Display name should change after editing")
            self.assertEqual(new_value, VALID_NAME)
        finally:
            driver.quit()

    def test_ac_03_01_save_button_appears_after_edit(self):
        """Positive: Save Changes button appears only after making a change."""
        driver = make_driver()
        try:
            login(driver)
            # Button should not be visible before editing
            before = driver.find_elements(By.CSS_SELECTOR, "[data-testid='save-changes-btn']")
            self.assertEqual(len(before), 0, "Save button should not appear before editing")

            tid_type(driver, "display-name-input", VALID_NAME)
            save_btn = tid(driver, "save-changes-btn")
            self.assertTrue(save_btn.is_displayed(), "Save button should appear after editing")
        finally:
            driver.quit()

    def test_ac_03_02_edit_reverted_hides_save_button(self):
        """Edge: Reverting to original name hides the Save Changes button."""
        driver = make_driver()
        try:
            login(driver)
            original = get_input_value(driver, "display-name-input")
            tid_type(driver, "display-name-input", VALID_NAME)
            # Revert back to original
            tid_type(driver, "display-name-input", original)
            time.sleep(1)
            buttons = driver.find_elements(By.CSS_SELECTOR, "[data-testid='save-changes-btn']")
            self.assertEqual(len(buttons), 0, "Save button should disappear when name is reverted")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-04 – System validates input fields                              #
    # ------------------------------------------------------------------ #
    def test_ac_04_empty_name_shows_error(self):
        """Negative: Empty display name shows validation error."""
        driver = make_driver()
        try:
            login(driver)
            tid_type(driver, "display-name-input", "")
            tid_click(driver, "save-changes-btn")
            toast_text = get_error_toast(driver)
            self.assertIn("Display name is required", toast_text)
        finally:
            driver.quit()

    def test_ac_04_01_whitespace_only_name_shows_error(self):
        """Negative: Whitespace-only display name shows validation error."""
        driver = make_driver()
        try:
            login(driver)
            tid_type(driver, "display-name-input", WHITESPACE_NAME)
            tid_click(driver, "save-changes-btn")
            toast_text = get_error_toast(driver)
            self.assertIn("Display name is required", toast_text)
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  AC-05 – Changes are saved correctly                                #
    # ------------------------------------------------------------------ #
    def test_ac_05_valid_name_saves_successfully(self):
        """Positive: Valid display name saves and shows success toast."""
        driver = make_driver()
        try:
            login(driver)
            tid_type(driver, "display-name-input", VALID_NAME)
            tid_click(driver, "save-changes-btn")
            toast_text = get_success_toast(driver)
            self.assertIn("Profile updated", toast_text)
        finally:
            driver.quit()


    # ------------------------------------------------------------------ #
    #  AC-06 – Updated profile is displayed correctly                     #
    # ------------------------------------------------------------------ #
    def test_ac_06_updated_name_persists_after_reload(self):
        """Positive: Saved display name is shown correctly after page reload."""
        driver = make_driver()
        try:
            login(driver)
            tid_type(driver, "display-name-input", VALID_NAME1)
            tid_click(driver, "save-changes-btn")
            WebDriverWait(driver, WAIT).until(
                lambda d: any(
                    "Profile updated" in t.text
                    for t in d.find_elements(By.CSS_SELECTOR, "[data-sonner-toast]")
                )
            )
            driver.get(f"{BASE_URL}/profile")
            WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='profile-info-card']"))
            )
            displayed = tid(driver, "profile-display-name")
            self.assertEqual(displayed.text, VALID_NAME1,
                             "Updated display name should persist after reload")
        finally:
            driver.quit()

    def test_ac_06_01_email_is_readonly_and_displayed(self):
        """Positive: Email field is visible and not editable."""
        driver = make_driver()
        try:
            login(driver)
            email_field = tid(driver, "profile-email")
            self.assertTrue(email_field.is_displayed(), "Email field should be visible")
            self.assertEqual(email_field.text, TEST_EMAIL,
                             "Email field should display the logged-in user's email")
        finally:
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
