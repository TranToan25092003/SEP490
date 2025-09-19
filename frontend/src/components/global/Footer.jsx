import React from "react";
import { Layout, Row, Col, Typography, Divider } from "antd";
const { Footer } = Layout;
const { Title, Text, Link } = Typography;
import { useLoaderData } from "react-router-dom";

const AppFooter = () => {
  const year = new Date().getFullYear();
  const { footerInfo } = useLoaderData();

  const { address, email, facebook, iframe, phone, zalo } = footerInfo;
  console.log(iframe);
  return (
    <Footer
      style={{
        backgroundColor: "#f0f2f5",
        padding: "40px 0px",
      }}
    >
      <Row gutter={[32, 32]}>
        <Col xs={24} sm={12} md={6} style={{ textAlign: "center" }}>
          <Title level={5}>Address</Title>
          <div className="flex flex-col content-center justify-center">
            <Link href="/about"> {address} </Link>
            <br />
            <div
              className="ml-auto mr-auto"
              dangerouslySetInnerHTML={{
                __html: iframe,
              }}
            ></div>
          </div>
        </Col>

        <Col xs={24} sm={12} md={6} style={{ textAlign: "center" }}>
          <Title level={5}>Support</Title>
          <div>
            <Link href="/help">{phone} </Link>
            <br />
            <Link href="/contact"> {email} </Link>
            <br />
          </div>
        </Col>

        <Col xs={24} sm={12} md={6} style={{ textAlign: "center" }}>
          <Title level={5}>Legal</Title>
          <div>
            <Link href="/terms">Terms of Service</Link>
            <br />
            <Link href="/privacy">Privacy Policy</Link>
          </div>
        </Col>

        <Col xs={24} sm={12} md={6} style={{ textAlign: "center" }}>
          <Title level={5}>Follow Us</Title>
          <div>
            <Link href={facebook} target="_blank">
              Facebook
            </Link>
            <br />
            <Link href={zalo} target="_blank">
              Zalo
            </Link>
            <br />
          </div>
        </Col>
      </Row>

      <Divider style={{ marginTop: 40 }} />

      <Text type="secondary" style={{ display: "block", textAlign: "center" }}>
        © {year} All rights reserved.
      </Text>
    </Footer>
  );
};

export default AppFooter;
