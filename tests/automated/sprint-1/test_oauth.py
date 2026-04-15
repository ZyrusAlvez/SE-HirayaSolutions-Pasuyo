import json
import os
import time
import unittest

from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

BASE_URL = os.getenv("BASE_URL")
GOOGLE_EMAIL = os.getenv("GOOGLE_EMAIL")
GOOGLE_PASSWORD = os.getenv("GOOGLE_PASSWORD")
SUPABASE_TOKEN_KEY = os.getenv("SUPABASE_TOKEN_KEY")

WAIT = 15  # seconds


def make_driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--disable-popup-blocking")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()), options=options
    )
    # Remove the navigator.webdriver flag that Google checks
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
        "source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    })
    return driver


class TestOAuthLogin(unittest.TestCase):

    # ------------------------------------------------------------------ #
    #  TC1 – OAuth button is visible on the Login screen                  #
    # ------------------------------------------------------------------ #
    def test_01_google_button_visible_on_login(self):
        driver = make_driver()
        try:
            driver.get(f"{BASE_URL}/login")
            btn = WebDriverWait(driver, WAIT).until(
                EC.visibility_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='google-login-btn']")
                )
            )
            self.assertTrue(btn.is_displayed(), "Google button should be visible on login page")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC2 – OAuth button is visible on the Sign-up screen                #
    # ------------------------------------------------------------------ #
    def test_02_google_button_visible_on_signup(self):
        driver = make_driver()
        try:
            driver.get(f"{BASE_URL}/signup")
            btn = WebDriverWait(driver, WAIT).until(
                EC.visibility_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='google-signup-btn']")
                )
            )
            self.assertTrue(btn.is_displayed(), "Google button should be visible on signup page")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC3 – OAuth button is clickable                                    #
    # ------------------------------------------------------------------ #
    def test_03_google_button_is_clickable(self):
        driver = make_driver()
        try:
            driver.get(f"{BASE_URL}/login")
            btn = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='google-login-btn']")
                )
            )
            self.assertTrue(btn.is_enabled(), "Google button should be enabled/clickable")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC4 – Clicking the button opens the Google OAuth window            #
    # ------------------------------------------------------------------ #
    def test_04_google_oauth_window_appears(self):
        driver = make_driver()
        try:
            driver.get(f"{BASE_URL}/login")
            btn = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='google-login-btn']")
                )
            )
            main_window = driver.current_window_handle
            driver.execute_script("arguments[0].click();", btn)

            # Wait for a new window/tab to appear
            WebDriverWait(driver, WAIT).until(EC.number_of_windows_to_be(2))
            new_window = [w for w in driver.window_handles if w != main_window][0]
            driver.switch_to.window(new_window)

            WebDriverWait(driver, WAIT).until(
                EC.url_contains("accounts.google.com")
            )
            self.assertIn(
                "accounts.google.com",
                driver.current_url,
                "OAuth window should redirect to accounts.google.com",
            )
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC5 – User is redirected to the OAuth provider (URL check)         #
    # ------------------------------------------------------------------ #
    def test_05_redirected_to_oauth_provider(self):
        driver = make_driver()
        try:
            driver.get(f"{BASE_URL}/login")
            btn = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='google-login-btn']")
                )
            )
            main_window = driver.current_window_handle
            driver.execute_script("arguments[0].click();", btn)

            WebDriverWait(driver, WAIT).until(EC.number_of_windows_to_be(2))
            oauth_window = [w for w in driver.window_handles if w != main_window][0]
            driver.switch_to.window(oauth_window)

            WebDriverWait(driver, WAIT).until(
                EC.url_contains("accounts.google.com")
            )
            self.assertIn("accounts.google.com", driver.current_url)
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC6 – Successful OAuth auth redirects user back to the app         #
    #  TC7 – Authentication token is stored in localStorage               #
    # ------------------------------------------------------------------ #
    def test_06_07_successful_oauth_redirects_and_stores_token(self):
        driver = make_driver()
        try:
            driver.get(f"{BASE_URL}/login")
            btn = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='google-login-btn']")
                )
            )
            main_window = driver.current_window_handle
            driver.execute_script("arguments[0].click();", btn)

            WebDriverWait(driver, WAIT).until(EC.number_of_windows_to_be(2))
            oauth_window = [w for w in driver.window_handles if w != main_window][0]
            driver.switch_to.window(oauth_window)

            # Enter Google email
            WebDriverWait(driver, WAIT).until(
                EC.visibility_of_element_located((By.ID, "identifierId"))
            ).send_keys(GOOGLE_EMAIL)
            driver.find_element(By.ID, "identifierNext").click()

            # Enter Google password
            WebDriverWait(driver, WAIT).until(
                EC.visibility_of_element_located((By.NAME, "Passwd"))
            ).send_keys(GOOGLE_PASSWORD)
            driver.find_element(By.ID, "passwordNext").click()

            # OAuth window should close and we return to the main app window
            WebDriverWait(driver, WAIT * 2).until(EC.number_of_windows_to_be(1))
            driver.switch_to.window(main_window)

            # TC6 – should land back on the app (not on login)
            WebDriverWait(driver, WAIT).until(
                lambda d: "/login" not in d.current_url
            )
            self.assertNotIn("/login", driver.current_url, "Should be redirected away from login after OAuth")

            # TC7 – token should be in localStorage
            token_raw = driver.execute_script(
                f"return window.localStorage.getItem('{SUPABASE_TOKEN_KEY}');"
            )
            self.assertIsNotNone(token_raw, "Supabase auth token should be present in localStorage")
            token = json.loads(token_raw)
            self.assertIn("access_token", token, "Token object should contain access_token")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC8 – Authenticated user can access a protected page               #
    # ------------------------------------------------------------------ #
    def test_08_authenticated_user_can_access_protected_page(self):
        driver = make_driver()
        try:
            driver.get(f"{BASE_URL}/login")
            btn = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='google-login-btn']")
                )
            )
            main_window = driver.current_window_handle
            driver.execute_script("arguments[0].click();", btn)

            WebDriverWait(driver, WAIT).until(EC.number_of_windows_to_be(2))
            oauth_window = [w for w in driver.window_handles if w != main_window][0]
            driver.switch_to.window(oauth_window)

            WebDriverWait(driver, WAIT).until(
                EC.visibility_of_element_located((By.ID, "identifierId"))
            ).send_keys(GOOGLE_EMAIL)
            driver.find_element(By.ID, "identifierNext").click()

            WebDriverWait(driver, WAIT).until(
                EC.visibility_of_element_located((By.NAME, "Passwd"))
            ).send_keys(GOOGLE_PASSWORD)
            driver.find_element(By.ID, "passwordNext").click()

            WebDriverWait(driver, WAIT * 2).until(EC.number_of_windows_to_be(1))
            driver.switch_to.window(main_window)

            # Navigate to a protected page
            driver.get(f"{BASE_URL}/profile")
            WebDriverWait(driver, WAIT).until(
                lambda d: "/profile" in d.current_url or d.current_url == f"{BASE_URL}/"
            )
            # Should stay on profile, not be kicked to login
            self.assertNotIn("/login", driver.current_url, "Authenticated user should access /profile")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC9 – Unauthenticated user is redirected to login                  #
    # ------------------------------------------------------------------ #
    def test_09_unauthenticated_user_redirected_to_login(self):
        driver = make_driver()
        try:
            # Visit a protected page with no session
            driver.get(f"{BASE_URL}/profile")
            WebDriverWait(driver, WAIT).until(EC.url_contains("/login"))
            self.assertIn("/login", driver.current_url, "Unauthenticated user should be redirected to /login")
        finally:
            driver.quit()

    # ------------------------------------------------------------------ #
    #  TC10 – User can log out and session is cleared                     #
    # ------------------------------------------------------------------ #
    def test_10_logout_clears_session(self):
        driver = make_driver()
        try:
            driver.get(f"{BASE_URL}/login")
            btn = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='google-login-btn']")
                )
            )
            main_window = driver.current_window_handle
            driver.execute_script("arguments[0].click();", btn)

            WebDriverWait(driver, WAIT).until(EC.number_of_windows_to_be(2))
            oauth_window = [w for w in driver.window_handles if w != main_window][0]
            driver.switch_to.window(oauth_window)

            WebDriverWait(driver, WAIT).until(
                EC.visibility_of_element_located((By.ID, "identifierId"))
            ).send_keys(GOOGLE_EMAIL)
            driver.find_element(By.ID, "identifierNext").click()

            WebDriverWait(driver, WAIT).until(
                EC.visibility_of_element_located((By.NAME, "Passwd"))
            ).send_keys(GOOGLE_PASSWORD)
            driver.find_element(By.ID, "passwordNext").click()

            WebDriverWait(driver, WAIT * 2).until(EC.number_of_windows_to_be(1))
            driver.switch_to.window(main_window)

            # Go to profile and click logout
            driver.get(f"{BASE_URL}/profile")
            logout_btn = WebDriverWait(driver, WAIT).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "[data-testid='logout-btn']")
                )
            )
            driver.execute_script("arguments[0].click();", logout_btn)

            # Should be redirected to login
            WebDriverWait(driver, WAIT).until(EC.url_contains("/login"))
            self.assertIn("/login", driver.current_url, "After logout, user should be on /login")

            # Token should be gone from localStorage
            token_raw = driver.execute_script(
                f"return window.localStorage.getItem('{SUPABASE_TOKEN_KEY}');"
            )
            self.assertIsNone(token_raw, "Supabase token should be cleared from localStorage after logout")
        finally:
            driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
