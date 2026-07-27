import React, { useState, useEffect, useRef } from "react";
import { FaEllipsisV } from "react-icons/fa";

const ActionMenu = ({ options }) => {
  /* {
            danger: Boolean,
            label: String,
            onClick: function
    } */
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the menu if the user clicks anywhere else on the screen
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="action-menu-container" ref={menuRef}>
      <button
        className="action-menu-btn"
        onClick={(e) => {
          e.stopPropagation(); // Prevents triggering parent onClick events
          setIsOpen(!isOpen);
        }}
      >
        <FaEllipsisV />
      </button>

      {isOpen && (
        <div className="action-menu-dropdown">
          {options.map((option, index) => (
            <button
              key={index}
              className={`action-menu-item ${option.danger ? "danger" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                option.onClick();
                setIsOpen(false); // Close menu after clicking an option
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionMenu;
