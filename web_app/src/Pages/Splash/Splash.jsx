import React from "react"
import { useState } from "react"
import { Link } from "react-router-dom";
import SearchBar from "../../Components/SearchBar/SearchBar";
import Button from "../../Components/SimpleButton/Button";
import { useRouting } from "../../hooks/useRouting";
import "./Splash.styles.css"


function SplashPage(){
    const [join, setJoin]= useState(null); //true = join an active session, false = host a new session
    const {gotoPage}= useRouting() // function to navigate to a different page
    return(
        <>
            <section>
                <div className="container">

                    <h1 className="title-txt">
                        TurnItApp
                    </h1>


                    <nav>
                    <Button onClick={()=>gotoPage("join_session")}>
                        Join a session
                    </Button>

                    <Button onClick={()=>setJoin(false)}>
                        Host a session
                    </Button>
                    </nav>

                </div>
                
            </section>
        </>
    )

}

export default SplashPage