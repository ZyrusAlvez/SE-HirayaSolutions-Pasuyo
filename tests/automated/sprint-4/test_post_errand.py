import os
import time
import tempfile
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

BASE_URL             = os.getenv("BASE_URL")
ERRAND_TEST_EMAIL    = os.getenv("ERRAND_TEST_EMAIL")
ERRAND_TEST_PASSWORD = os.getenv("ERRAND_TEST_PASSWORD")
ASSETS_DIR           = os.path.join(os.path.dirname(__file__), "assets")
VALID_IMAGE          = os.path.join(ASSETS_DIR, "valid.jpg")

WAIT = 20


def make_driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--no-first-run")
    options.add_argument("--no-default-browser-check")
    options.add_argument(f"--user-data-dir={tempfile.mkdtemp()}")
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
    driver.execute_script("""
        var el = arguments[0];
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    """, el)


def tid_type(driver, test_id, value):
    if value is None:
        raise ValueError(f"tid_type called with None value for testid '{test_id}' — check your .env file")
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, f"[data-testid='{test_id}']"))
    )
    driver.execute_script("""
        var wrapper = document.querySelector("[data-testid='" + arguments[0] + "']");
        var el = wrapper.tagName === 'INPUT' || wrapper.tagName === 'TEXTAREA'
            ? wrapper : (wrapper.querySelector('textarea') || wrapper.querySelector('input'));
        var proto = el.tagName === 'TEXTAREA'
            ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        var setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
        setter.call(el, arguments[1]);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    """, test_id, value)


def get_input_value(driver, test_id):
    return driver.execute_script("""
        var wrapper = document.querySelector("[data-testid='" + arguments[0] + "']");
        var el = wrapper.tagName === 'INPUT' || wrapper.tagName === 'TEXTAREA'
            ? wrapper : (wrapper.querySelector('textarea') || wrapper.querySelector('input'));
        return el ? el.value : null;
    """, test_id)


def login(driver):
    driver.get(f"{BASE_URL}/login")
    tid_type(driver, "login-email", ERRAND_TEST_EMAIL)
    tid_type(driver, "login-password", ERRAND_TEST_PASSWORD)
    tid_click(driver, "login-btn")
    WebDriverWait(driver, WAIT).until(lambda d: "/login" not in d.current_url)


def go_to_post_errand(driver):
    login(driver)
    driver.get(f"{BASE_URL}/post-errand")
    WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='post-errand-title']"))
    )
    time.sleep(2)


def select_deadline(driver):
    """Open the deadline picker, select the first available day, confirm time."""
    tid_click(driver, "deadline-picker-btn")
    # Click the first non-disabled day cell
    day_btn = WebDriverWait(driver, WAIT).until(
        EC.element_to_be_clickable(
            (By.XPATH, "//div[contains(@style,'aspectRatio') and not(@disabled)]")
        )
    )
    driver.execute_script("arguments[0].click();", day_btn)
    # Confirm time
    tid_click(driver, "deadline-confirm-btn")
    time.sleep(1)


def upload_image(driver):
    """Click the image upload button and inject a file via the hidden file input."""
    tid_click(driver, "image-upload-btn")
    driver.execute_script("""
        var inputs = document.querySelectorAll('input[type="file"]');
        inputs.forEach(function(el) {
            el.style.display = 'block';
            el.style.opacity = '1';
            el.style.position = 'fixed';
            el.style.top = '0'; el.style.left = '0';
            el.style.zIndex = '9999';
        });
    """)
    file_input = WebDriverWait(driver, WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='file']"))
    )
    file_input.send_keys(os.path.abspath(VALID_IMAGE))
    time.sleep(1)


class TestPostErrand(unittest.TestCase):

    def tearDown(self):
        time.sleep(2)

    # ------------------------------------------------------------------ #
    #  TC-ERR-01-01 – Create errand form is visible                      #
    # ------------------------------------------------------------------ #
    def test_err_01_01_01_form_visible(self):
        """Positive: Post errand form is visible and accessible after login."""
        driver = make_driver()
        try:
            go_to_post_errand(driver)
            # Check all elements in one JS call to avoid sequential WebDriverWait conflicts
            results = driver.execute_script("""
                var ids = ['post-errand-title', 'post-errand-description', 'post-errand-submit'];
                return ids.map(function(id) {
                    var el = document.querySelector("[data-testid='" + id + "']");
                    if (!el) return false;
                    var rect = el.getBoundingClientRect();
                    return rect.width > 0 && rect.height > 0;
                });
            """)
            print(results)
            self.assertTrue(results[0], "Title input should be visible")
            self.assertTrue(results[1], "Description input should be visible")
            self.assertTrue(results[2], "Submit button should be visible")
        finally:
            driver.quit()

    def test_err_01_01_02_form_not_accessible_when_logged_out(self):
        """Negative: Unauthenticated user is redirected away from post-errand page."""
        driver = make_driver()
        try:
            driver.get(f"{BASE_URL}/post-errand")
            WebDriverWait(driver, WAIT).until(
                lambda d: "/post-errand" not in d.current_url
            )
            self.assertNotIn("/post-errand", driver.current_url,
                             "Unauthenticated user should not access post-errand page")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-ERR-01-02 – User can input title and description               #
    # ------------------------------------------------------------------ #
    def test_err_01_02_01_user_can_input_title(self):
        """Positive: User can type a valid title."""
        driver = make_driver()
        try:
            go_to_post_errand(driver)
            tid_type(driver, "post-errand-title", "Test Errand Title")
            self.assertEqual(get_input_value(driver, "post-errand-title"), "Test Errand Title")
        finally:
            driver.quit()

    def test_err_01_02_02_user_can_input_description(self):
        """Positive: User can type a valid description."""
        driver = make_driver()
        try:
            go_to_post_errand(driver)
            tid_type(driver, "post-errand-description", "Test errand description")
            self.assertEqual(get_input_value(driver, "post-errand-description"),
                             "Test errand description")
        finally:
            driver.quit()

    def test_err_01_02_03_empty_title_shows_error(self):
        """Negative: Submitting without a title shows a validation error."""
        driver = make_driver()
        try:
            go_to_post_errand(driver)
            tid_type(driver, "post-errand-description", "Some description")
            tid_click(driver, "task-type-remote")
            tid_click(driver, "post-errand-submit")
            time.sleep(1)
            WebDriverWait(driver, WAIT).until(
                lambda d: len(d.find_elements(
                    By.CSS_SELECTOR, "[data-sonner-toast][data-type='error']"
                )) > 0
            )
            toasts = driver.find_elements(
                By.CSS_SELECTOR, "[data-sonner-toast][data-type='error']"
            )
            
            toast_text = " ".join(t.text for t in toasts)
            self.assertIn("title", toast_text.lower(),
                          "Error toast should mention title is required")
            self.assertIn("/post-errand", driver.current_url,
                          "Form should not submit without a title")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-ERR-01-03 – User can set pickup and drop-off locations         #
    # ------------------------------------------------------------------ #
    def test_err_01_03_01_location_picker_visible_for_onsite(self):
        """Positive: Location picker button is visible when Onsite task type is selected."""
        driver = make_driver()
        try:
            go_to_post_errand(driver)
            tid_click(driver, "task-type-onsite")
            btn = tid(driver, "location-picker-btn")
            self.assertTrue(btn.is_displayed(),
                            "Location picker should be visible for Onsite errands")
        finally:
            driver.quit()

    def test_err_01_03_02_location_picker_hidden_for_remote(self):
        """Positive: Location picker is not shown when Remote task type is selected."""
        driver = make_driver()
        try:
            go_to_post_errand(driver)
            tid_click(driver, "task-type-remote")
            time.sleep(1)
            btns = driver.find_elements(By.CSS_SELECTOR, "[data-testid='location-picker-btn']")
            self.assertEqual(len(btns), 0,
                             "Location picker should not appear for Remote errands")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-ERR-01-04 – User can set deadline/date                         #
    # ------------------------------------------------------------------ #
    def test_err_01_04_01_deadline_picker_visible(self):
        """Positive: Deadline picker button is visible on the form."""
        driver = make_driver()
        try:
            go_to_post_errand(driver)
            btn = tid(driver, "deadline-picker-btn")
            self.assertTrue(btn.is_displayed(),
                            "Deadline picker button should be visible")
        finally:
            driver.quit()

    def test_err_01_04_02_deadline_picker_opens(self):
        """Positive: Clicking the deadline picker opens the calendar modal."""
        driver = make_driver()
        try:
            go_to_post_errand(driver)
            tid_click(driver, "deadline-picker-btn")
            time.sleep(5)
            calendar = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.XPATH, "//*[contains(text(), 'January') or contains(text(), 'February') or "
                               "contains(text(), 'March') or contains(text(), 'April') or "
                               "contains(text(), 'May') or contains(text(), 'June') or "
                               "contains(text(), 'July') or contains(text(), 'August') or "
                               "contains(text(), 'September') or contains(text(), 'October') or "
                               "contains(text(), 'November') or contains(text(), 'December')]")
                )
            )
            self.assertTrue(calendar.is_displayed(),
                            "Calendar modal should open after clicking deadline picker")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-ERR-01-05 – User can set budget/payment                        #
    # ------------------------------------------------------------------ #
    def test_err_01_05_01_user_can_input_budget(self):
        """Positive: User can enter a valid budget amount."""
        driver = make_driver()
        try:
            go_to_post_errand(driver)
            tid_type(driver, "post-errand-budget", "500")
            self.assertEqual(get_input_value(driver, "post-errand-budget"), "500")
        finally:
            driver.quit()

    def test_err_01_05_02_budget_rejects_non_numeric(self):
        """Negative: Non-numeric characters are stripped from the budget field."""
        driver = make_driver()
        try:
            go_to_post_errand(driver)
            tid_type(driver, "post-errand-budget", "abc")
            value = get_input_value(driver, "post-errand-budget")
            self.assertEqual(value, "", "Budget field should reject non-numeric input")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-ERR-01-06 – User can upload documents or images                #
    # ------------------------------------------------------------------ #
    def test_err_01_06_01_image_upload_btn_visible(self):
        """Positive: Image upload button is visible on the form."""
        driver = make_driver()
        try:
            go_to_post_errand(driver)
            btn = tid(driver, "image-upload-btn")
            self.assertTrue(btn.is_displayed(),
                            "Image upload button should be visible")
        finally:
            driver.quit()

    def test_err_01_06_02_user_can_upload_image(self):
        """Positive: User can upload a valid image and preview appears."""
        driver = make_driver()
        try:
            go_to_post_errand(driver)
            upload_image(driver)
            time.sleep(3)
            found = WebDriverWait(driver, WAIT).until(
                lambda d: d.execute_script("""
                    var img = document.querySelector("img[src^='data:'],img[src^='blob:']");
                    if (!img) return false;
                    var r = img.getBoundingClientRect();
                    return r.width > 0 && r.height > 0;
                """)
            )
            self.assertTrue(found, "Image preview should appear after upload")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-ERR-01-07 – System saves errand correctly in the database      #
    # ------------------------------------------------------------------ #
    def test_err_01_07_01_errand_saved_and_visible_after_submit(self):
        """Positive: Submitted errand appears in admin errand list after creation."""
        driver = make_driver()
        admin_driver = make_driver()
        unique_title = f"DB Save Test {int(time.time())}"
        try:
            # User posts errand
            go_to_post_errand(driver)
            tid_type(driver, "post-errand-title", unique_title)
            tid_type(driver, "post-errand-description", "Checking DB persistence")
            tid_click(driver, "task-type-remote")
            tid_type(driver, "post-errand-budget", "200")
            tid_click(driver, "post-errand-submit")
            WebDriverWait(driver, WAIT).until(lambda d: "/post-errand" not in d.current_url)

            # Admin logs in and searches for the errand
            admin_driver.get(f"{BASE_URL}/login")
            tid_type(admin_driver, "login-email", os.getenv("ADMIN_EMAIL"))
            tid_type(admin_driver, "login-password", os.getenv("ADMIN_PASSWORD"))
            tid_click(admin_driver, "login-btn")
            WebDriverWait(admin_driver, WAIT).until(lambda d: "/login" not in d.current_url)
            
            admin_driver.get(f"{BASE_URL}/admin/errands")
            time.sleep(3)
            tid_type(admin_driver, "admin-errand-search", unique_title)
            time.sleep(2)
            
            self.assertIn(unique_title, admin_driver.page_source,
                          "Submitted errand should appear in admin errand list")
        finally:
            driver.quit()
            admin_driver.quit()

    # ------------------------------------------------------------------ #
    #  TC-ERR-01-08 – Confirmation message appears after creation        #
    # ------------------------------------------------------------------ #
    def test_err_01_08_01_success_toast_shown_after_submit(self):
        """Positive: Success toast appears after successfully posting an errand."""
        driver = make_driver()
        try:
            go_to_post_errand(driver)
            tid_type(driver, "post-errand-title", f"Toast Test {int(time.time())}")
            tid_type(driver, "post-errand-description", "Testing confirmation message")
            tid_click(driver, "task-type-remote")
            tid_type(driver, "post-errand-budget", "150")
            tid_click(driver, "post-errand-submit")
            WebDriverWait(driver, WAIT).until(
                lambda d: any(
                    "Errand posted" in t.text
                    for t in d.find_elements(By.CSS_SELECTOR, "[data-sonner-toast]")
                )
            )
            toasts = driver.find_elements(By.CSS_SELECTOR, "[data-sonner-toast]")
            texts = " ".join(t.text for t in toasts)
            self.assertIn("Errand posted", texts,
                          "Success toast should appear after posting an errand")
        finally:
            driver.quit()

    def test_err_01_08_02_redirected_after_submit(self):
        """Positive: User is redirected away from post-errand page after successful submission."""
        driver = make_driver()
        try:
            go_to_post_errand(driver)
            tid_type(driver, "post-errand-title", f"Redirect Test {int(time.time())}")
            tid_type(driver, "post-errand-description", "Testing redirect after submit")
            tid_click(driver, "task-type-remote")
            tid_type(driver, "post-errand-budget", "100")
            tid_click(driver, "post-errand-submit")
            WebDriverWait(driver, WAIT).until(
                lambda d: "/post-errand" not in d.current_url
            )
            self.assertNotIn("/post-errand", driver.current_url,
                             "User should be redirected after successful submission")
        finally:
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
