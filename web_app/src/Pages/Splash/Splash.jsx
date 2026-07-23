import React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../../Components/SearchBar/SearchBar";
import Button from "../../Components/SimpleButton/Button";
import { useRouting } from "../../hooks/useRouting";
import "./Splash.styles.css";

function SplashPage() {
  const { gotoPage } = useRouting(); // function to navigate to a different page
  const hostData = JSON.parse(localStorage.getItem("hostData"));
  const sessionData = JSON.parse(localStorage.getItem("sessionData"));
  return (
    <>
      <section>
        <div className="container">
          <h1 className="title-txt">TurnItApp</h1>

          <nav>
            <Button onClick={() => gotoPage("join_session")}>
              Join a session
            </Button>
            <Button onClick={() => gotoPage("host_session")}>
              Host a session
            </Button>
            {/* continue in session as participant */}
            {sessionData && (
              <Button
                onClick={() =>
                  gotoPage("suggest_songs", sessionData.activeSessionCode)
                }
              >
                Continue in {sessionData.activeSessionCode}
              </Button>
            )}
            {/* continue in session as host */}
            {hostData && (
              <Button onClick={() => gotoPage("host_dashboard", hostData.code)}>
                Continue in {hostData.code}
              </Button>
            )}
          </nav>
        </div>
      </section>
    </>
  );
}

export default SplashPage;
