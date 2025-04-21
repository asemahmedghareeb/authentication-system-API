import React, { useEffect } from "react";
import googleButton from "./assets/google_signin_buttons/web/1x/btn_google_signin_dark_pressed_web.png";
import "./App.css";
import { useNavigate, useSearchParams } from "react-router-dom";

function App() {
  const navigate = useNavigate();

  async function auth() {
    const response = await fetch("http://localhost:3000/api/v1/oauth/request", {
      method: "POST",
    });
    const res = await response.json();
    console.log(res.data.url);
    window.location.href = res.data.url;
  }

  return (
    <>
      <h1>Welcome to Consulting Ninja!</h1>
      <h3>Google OAuth!</h3>
      <p>
        Visit{" "}
        <a href="https://www.youtube.com/@ConsultingNinja/featured">
          <strong>@ConsultingNinja</strong>
        </a>{" "}
        to see more great videos!
      </p>

      <button className="btn-auth" type="button" onClick={auth}>
        <img className="btn-auth-img" src={googleButton} alt="google sign in" />
      </button>
    </>
  );
}

function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (code) {
      console.log("Authorization Code Received:", code);
      exchangeCode(code);
    } else if (error) {
      console.error("Google Login Error:", error);
      navigate("/login?error=google_login_failed");
    } else {
      navigate("/login?error=invalid_auth_callback");
    }
  }, [searchParams, navigate]);

  const exchangeCode = async (authCode) => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/v1/oauth/exchange-code",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: authCode }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const { accessToken, refreshToken } = data;
        console.log("Tokens Received:", { accessToken, refreshToken });
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
      } else {
        console.error("Error exchanging code for tokens:", response.status);
      }
    } catch (error) {
      console.error("Error exchanging code:", error);
    }
  };

  return (
    <div>
      <h1>congrats you logged in successfully</h1>
    </div>
  );
}

export { App, AuthCallback };
