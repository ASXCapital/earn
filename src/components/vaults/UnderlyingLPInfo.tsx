import React, { useState } from "react";
import { Button, Row, Col, Tooltip, OverlayTrigger } from "react-bootstrap";
import styles from "./UnderlyingLPInfo.module.css"; // Ensure the correct path

interface UnderlyingLPInfoProps {
  name: string;
  address: string;
}

const UnderlyingLPInfo: React.FC<UnderlyingLPInfoProps> = ({
  name,
  address,
}) => {
  const [buttonText, setButtonText] = useState("Copy");

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address).then(
      () => {
        setButtonText("Copied!");
        setTimeout(() => {
          setButtonText("Copy"); // Reset the button text after 2 seconds
        }, 2000);
      },
      (err) => {
        console.error("Failed to copy: ", err);
      },
    );
  };

  return (
    <Row className="align-items-center">
      <Col>
        <span className={styles.lpTitle}>Underlying LP: {name}</span>
      </Col>
      <Col xs="auto">
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip id="button-tooltip">
              {buttonText === "Copy" ? "Copy address" : "Address copied!"}
            </Tooltip>
          }
        >
          <Button
            onClick={copyToClipboard}
            size="sm"
            className={styles.copyButton}
          >
            {buttonText}
          </Button>
        </OverlayTrigger>
      </Col>
    </Row>
  );
};

export default UnderlyingLPInfo;
