import React from "react";
import { Typography, Row, Col, Card, Divider, Button } from "antd";
import {
  SmileOutlined,
  ThunderboltOutlined,
  ShoppingOutlined,
  MailOutlined,
  TeamOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

const About = () => (
  <div style={{ background: "#fff", minHeight: "100vh", padding: "40px 0" }}>
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
        padding: 32,
      }}
    >
      <Title level={2} style={{ textAlign: "center", marginBottom: 16 }}>
        Về WDP301
      </Title>
      <Paragraph
        style={{ fontSize: 18, textAlign: "center", marginBottom: 32 }}
      >
        WDP301 là nền tảng mua bán, đấu giá, cho mượn đồ dùng tiện lợi, an toàn
        và tiết kiệm. Chúng tôi kết nối cộng đồng để mọi người có thể trao đổi,
        mua bán, sử dụng lại các sản phẩm một cách thông minh và hiệu quả nhất.
        <br />
        <br />
        Được thành lập bởi một nhóm sinh viên đam mê công nghệ, WDP301 không chỉ
        là nơi giao dịch mà còn là nơi lan tỏa giá trị sống xanh, tiết kiệm và
        bền vững. Chúng tôi tin rằng mỗi sản phẩm đều có thể tiếp tục vòng đời
        của mình, mang lại lợi ích cho nhiều người hơn nữa.
      </Paragraph>
      <Divider />
      <Title level={3} style={{ textAlign: "center", marginBottom: 16 }}>
        Lịch sử phát triển
      </Title>
      <Row
        gutter={[32, 32]}
        justify="center"
        align="middle"
        style={{ marginBottom: 32 }}
      >
        <Col xs={24} md={8}>
          <Card
            bordered={false}
            style={{ textAlign: "center", borderRadius: 12, minHeight: 180 }}
          >
            <ClockCircleOutlined style={{ fontSize: 40, color: "#1890ff" }} />
            <Title level={4} style={{ marginTop: 16 }}>
              2023
            </Title>
            <Text>
              Bắt đầu ý tưởng và phát triển phiên bản đầu tiên của nền tảng.
            </Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            bordered={false}
            style={{ textAlign: "center", borderRadius: 12, minHeight: 180 }}
          >
            <RocketOutlined style={{ fontSize: 40, color: "#faad14" }} />
            <Title level={4} style={{ marginTop: 16 }}>
              2024
            </Title>
            <Text>
              Ra mắt chính thức, thu hút hàng trăm người dùng đầu tiên và liên
              tục cải tiến.
            </Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            bordered={false}
            style={{ textAlign: "center", borderRadius: 12, minHeight: 180 }}
          >
            <SafetyCertificateOutlined
              style={{ fontSize: 40, color: "#52c41a" }}
            />
            <Title level={4} style={{ marginTop: 16 }}>
              Tương lai
            </Title>
            <Text>
              Cam kết phát triển bền vững, mở rộng cộng đồng, nâng cao trải
              nghiệm người dùng.
            </Text>
          </Card>
        </Col>
      </Row>
      <Divider />
      <Title level={3} style={{ textAlign: "center", marginBottom: 16 }}>
        Sứ mệnh & Tầm nhìn
      </Title>
      <Row
        gutter={[32, 32]}
        justify="center"
        align="middle"
        style={{ marginBottom: 32 }}
      >
        <Col xs={24} md={8}>
          <Card
            bordered={false}
            style={{ textAlign: "center", borderRadius: 12, minHeight: 180 }}
          >
            <SmileOutlined style={{ fontSize: 40, color: "#52c41a" }} />
            <Title level={4} style={{ marginTop: 16 }}>
              Sứ mệnh
            </Title>
            <Text>
              Lan tỏa lối sống tiết kiệm, bảo vệ môi trường, giúp mọi người tận
              dụng tối đa giá trị của sản phẩm.
            </Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            bordered={false}
            style={{ textAlign: "center", borderRadius: 12, minHeight: 180 }}
          >
            <ThunderboltOutlined style={{ fontSize: 40, color: "#faad14" }} />
            <Title level={4} style={{ marginTop: 16 }}>
              Tầm nhìn
            </Title>
            <Text>
              Trở thành nền tảng giao dịch đồ dùng hàng đầu Việt Nam, nơi mọi
              người đều có thể mua bán, trao đổi, cho mượn một cách dễ dàng, an
              toàn và minh bạch.
            </Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            bordered={false}
            style={{ textAlign: "center", borderRadius: 12, minHeight: 180 }}
          >
            <ShoppingOutlined style={{ fontSize: 40, color: "#1890ff" }} />
            <Title level={4} style={{ marginTop: 16 }}>
              Giá trị cốt lõi
            </Title>
            <Text>
              Minh bạch, an toàn, nhanh chóng, thân thiện với người dùng và cộng
              đồng.
            </Text>
          </Card>
        </Col>
      </Row>
      <Divider />
      <Title level={3} style={{ textAlign: "center", marginBottom: 16 }}>
        Cam kết của chúng tôi
      </Title>
      <Paragraph style={{ fontSize: 16, marginBottom: 32 }}>
        <ul style={{ paddingLeft: 24 }}>
          <li>Luôn đặt lợi ích và sự an toàn của người dùng lên hàng đầu.</li>
          <li>
            Không ngừng đổi mới, cập nhật công nghệ để nâng cao trải nghiệm.
          </li>
          <li>Hỗ trợ, lắng nghe và đồng hành cùng cộng đồng người dùng.</li>
          <li>Góp phần xây dựng xã hội tiết kiệm, văn minh, bền vững.</li>
        </ul>
      </Paragraph>
      <Divider />
      <Title level={3} style={{ textAlign: "center", marginBottom: 16 }}>
        Đội ngũ phát triển & Liên hệ
      </Title>
      <Row gutter={[32, 32]} justify="center" align="middle">
        <Col xs={24} md={12}>
          <Card
            bordered={false}
            style={{ textAlign: "center", borderRadius: 12, minHeight: 180 }}
          >
            <TeamOutlined style={{ fontSize: 40, color: "#722ed1" }} />
            <Title level={4} style={{ marginTop: 16 }}>
              WDP301 Team
            </Title>
            <Text>
              Chúng tôi là những lập trình viên trẻ, đam mê công nghệ và mong
              muốn tạo ra giá trị cho cộng đồng. Mỗi thành viên đều đóng góp ý
              tưởng, công sức để xây dựng nên một nền tảng vững mạnh, hiện đại.
            </Text>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            bordered={false}
            style={{ textAlign: "center", borderRadius: 12, minHeight: 180 }}
          >
            <MailOutlined style={{ fontSize: 40, color: "#fa541c" }} />
            <Title level={4} style={{ marginTop: 16 }}>
              Liên hệ
            </Title>
            <Text>
              Email: <a href="mailto:wdp301@support.com">wdp301@support.com</a>
            </Text>
            <br />
            <Text>Địa chỉ: 123 Đường Công Nghệ, Quận Sáng Tạo, TP. HCM</Text>
          </Card>
        </Col>
      </Row>
      <Divider />
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <Button
          type="primary"
          size="large"
          href="/"
          style={{ borderRadius: 8 }}
        >
          Quay về trang chủ
        </Button>
      </div>
    </div>
  </div>
);

export default About;
