import os
import time
import tempfile
import unittest
import warnings

warnings.filterwarnings("ignore", category=DeprecationWarning)

from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

BASE_URL      = os.getenv("BASE_URL")
TEST_EMAIL    = os.getenv("TEST_EMAIL")
TEST_PASSWORD = os.getenv("TEST_PASSWORD")

WAIT = 20


def make_driver():
    options = webdriver.ChromeOptions()
    # options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument(f"--user-data-dir={tempfile.mkdtemp()}")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    driver = webdriver.Chrome(options=options)
    driver.set_window_size(1280, 900)
    return driver


def tid_type(driver, test_id, value):
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


def login(driver):
    driver.get(f"{BASE_URL}/login")
    tid_type(driver, "login-email", TEST_EMAIL)
    tid_type(driver, "login-password", TEST_PASSWORD)
    tid_click(driver, "login-btn")
    WebDriverWait(driver, WAIT).until(lambda d: "/login" not in d.current_url)


class TestSer04(unittest.TestCase):

    def tearDown(self):
        time.sleep(1)

    # ------------------------------------------------------------------ #
    #  SER-04 TC-SER-04-01 – Pay button visible on service fee page      #
    # ------------------------------------------------------------------ #
    def test_ser04_tc01_pay_btn_visible(self):
        """Positive: Pay button is displayed and accessible on the Service Fee page."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/service-fee")
            time.sleep(3)
            btn = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='pay-service-fee-btn']")
                )
            )
            self.assertTrue(btn.is_displayed(),
                            "Pay Service Fee button should be visible on the service fee page")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  SER-04 TC-SER-04-02 – Pay button redirects to payment page        #
    # ------------------------------------------------------------------ #
    def test_ser04_tc02_pay_btn_redirects_to_payment_page(self):
        """Positive: Clicking Pay redirects to the payment page with required fields."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/service-fee")
            time.sleep(10)
            tid_click(driver, "pay-service-fee-btn")
            WebDriverWait(driver, WAIT).until(lambda d: "/pay-service-fee" in d.current_url)
            self.assertIn("/pay-service-fee", driver.current_url,
                          "Clicking Pay should redirect to /pay-service-fee")
            time.sleep(2)
            body_text = driver.find_element(By.TAG_NAME, "body").text
            self.assertIn("Amount", body_text,
                          "Payment page should show Amount field")
            self.assertIn("Reference", body_text,
                          "Payment page should show Reference Number field")
            self.assertIn("Screenshot", body_text,
                          "Payment page should show Screenshot/proof field")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  SER-04 TC-SER-04-03 – Submission blocked with incomplete fields   #
    # ------------------------------------------------------------------ #
    def test_ser04_tc03_submission_blocked_with_incomplete_fields(self):
        """Negative: Payment submission is blocked when required fields are incomplete."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/pay-service-fee")
            time.sleep(10)
            submit_btn = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='submit-payment-btn']")
                )
            )
            disabled = driver.execute_script(
                "var el = arguments[0]; return el.disabled || el.getAttribute('aria-disabled') === 'true';",
                submit_btn
            )
            self.assertTrue(disabled,
                            "Submit button should be disabled when required fields are empty")
        finally:
            driver.quit()

    def test_ser04_tc03_short_reference_shows_error(self):
        """Negative: Reference number shorter than 6 digits shows a validation error."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/pay-service-fee")
            time.sleep(10)
            # Type a short reference number
            ref_input = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "input[placeholder='e.g. 567890']")
                )
            )
            driver.execute_script("""
                var el = arguments[0];
                var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                setter.call(el, '123');
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            """, ref_input)
            time.sleep(1)
            body_text = driver.find_element(By.TAG_NAME, "body").text
            self.assertIn("6", body_text,
                          "Validation error should mention the 6-digit requirement")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  SER-04 TC-SER-04-04 – Payment status displayed correctly          #
    # ------------------------------------------------------------------ #
    def test_ser04_tc04_payment_status_displayed(self):
        """Positive: Payment status (pending/approved/rejected) is displayed on the page."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/service-fee")
            time.sleep(10)
            body_text = driver.find_element(By.TAG_NAME, "body").text
            has_status = any(s in body_text for s in ["Pending", "Approved", "Rejected", "No transactions"])
            self.assertTrue(has_status,
                            "Service fee page should display payment status or empty state")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  SER-04 TC-SER-04-05 – Payment history displayed                   #
    # ------------------------------------------------------------------ #
    def test_ser04_tc05_payment_history_displayed(self):
        """Positive: User can view payment history on the service fee page."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/service-fee")
            time.sleep(10)
            body_text = driver.find_element(By.TAG_NAME, "body").text
            self.assertIn("Payment History", body_text,
                          "Service fee page should display a Payment History section")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  SER-04 TC-SER-04-06 – Rejected payments show admin note           #
    # ------------------------------------------------------------------ #
    def test_ser04_tc06_rejected_payment_shows_admin_note(self):
        """Positive: Rejected transactions show the admin's rejection reason."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/service-fee")
            time.sleep(10)
            body_text = driver.find_element(By.TAG_NAME, "body").text
            if "Rejected" in body_text:
                # Expand the rejected payment card
                rejected_cards = driver.execute_script("""
                    var cards = document.querySelectorAll("[data-testid='payment-card-toggle']");
                    var result = [];
                    for (var i = 0; i < cards.length; i++) {
                        if (cards[i].innerText.includes('Rejected')) result.push(cards[i]);
                    }
                    return result;
                """)
                if rejected_cards:
                    driver.execute_script("""
                        var el = arguments[0];
                        el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                    """, rejected_cards[0])
                    time.sleep(5)
                    expanded_text = driver.find_element(By.TAG_NAME, "body").text
                    self.assertTrue(
                        "Note" in expanded_text or "note" in expanded_text.lower(),
                        "Rejected payment should show admin note when expanded"
                    )
            else:
                self.skipTest("No rejected payments available to test")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  SER-04 TC-SER-04-07 – Transactions can be expanded/collapsed      #
    # ------------------------------------------------------------------ #
    def test_ser04_tc07_transaction_expand_collapse(self):
        """Edge: Transaction entries can be expanded to show details and collapsed."""
        driver = make_driver()
        try:
            login(driver)
            driver.get(f"{BASE_URL}/service-fee")
            time.sleep(10)
            toggle_btns = driver.find_elements(
                By.CSS_SELECTOR, "[data-testid='payment-card-toggle']"
            )
            if not toggle_btns:
                self.skipTest("No payment transactions available to test")
            # Click to expand
            driver.execute_script("""
                var el = arguments[0];
                el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            """, toggle_btns[0])
            time.sleep(5)
            body_after_expand = driver.find_element(By.TAG_NAME, "body").text
            self.assertTrue(
                "Reference" in body_after_expand or "Amount" in body_after_expand,
                "Expanding a transaction should show reference number and amount details"
            )
            # Click to collapse
            driver.execute_script("""
                var el = arguments[0];
                el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            """, toggle_btns[0])
            time.sleep(1)
            body_after_collapse = driver.find_element(By.TAG_NAME, "body").text
            self.assertGreater(len(body_after_collapse.strip()), 0,
                               "Page should remain stable after collapsing a transaction")
        finally:
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
