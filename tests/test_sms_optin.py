import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
DISCLOSURE = (
    "By checking this box, I agree to receive Geniemadeit order status and customer care "
    "text messages. Up to 2 messages per order or support case. Msg &amp; data rates may apply. "
    "Reply HELP for help and STOP to opt out. Consent is not a condition of purchase."
)


class SmsOptInSurfaceTest(unittest.TestCase):
    def test_signup_surfaces_have_optional_unchecked_sms_consent(self):
        for name in ("index.html", "app.html"):
            text = (ROOT / name).read_text()
            self.assertIn(DISCLOSURE, text, name)
            self.assertIn('id="authSmsAccepted" type="checkbox"', text, name)
            self.assertNotIn('id="authSmsAccepted" type="checkbox" checked', text, name)
            self.assertIn('id="authSmsTerms" type="checkbox"', text, name)

    def test_order_surface_has_separate_sms_and_terms_choices(self):
        text = (ROOT / "studio-create.html").read_text()
        self.assertIn(DISCLOSURE, text)
        self.assertIn('id="studioSmsAccepted" type="checkbox"', text)
        self.assertIn('id="studioSmsTerms" type="checkbox"', text)
        self.assertNotIn('id="studioSmsAccepted" type="checkbox" checked', text)

    def test_privacy_and_terms_contain_required_sms_language(self):
        privacy = (ROOT / "privacy.html").read_text()
        terms = (ROOT / "terms.html").read_text()
        self.assertIn("We do not sell or share your SMS opt-in data", privacy)
        self.assertIn("Arcade Inventors, LLC", privacy)
        for phrase in ("Message and data rates may apply", "<strong>HELP</strong>", "<strong>STOP</strong>", "Carriers are not liable"):
            self.assertIn(phrase, terms)

    def test_public_carrier_review_page_documents_actual_web_opt_in(self):
        text = (ROOT / "sms-consent.html").read_text()
        for phrase in (
            "https://geniemadeit.com/",
            "not pre-checked",
            "Up to 2 messages per order or support case",
            "Msg &amp; data rates may apply",
            "Reply HELP for help and STOP to opt out",
            "https://geniemadeit.com/privacy",
            "https://geniemadeit.com/terms",
            "/assets/sms-signup-proof.png",
        ):
            self.assertIn(phrase, text)
        self.assertTrue((ROOT / "assets" / "sms-signup-proof.png").is_file())

    def test_privacy_repeats_carrier_disclosures(self):
        text = (ROOT / "privacy.html").read_text()
        self.assertIn("up to 2 messages per order or support case", text)
        self.assertIn("Message and data rates may apply", text)
        self.assertIn("third parties for marketing purposes", text)


if __name__ == "__main__":
    unittest.main()
