import React from "react";
import { Modal, Button, Typography, Space } from "antd";
import { SignInButton } from "@clerk/clerk-react";
import { ExclamationCircleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

/**
 * A reusable modal component that displays when a user tries to access
 * a feature that requires authentication.
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is visible
 * @param {Function} props.onClose - Function to call when closing the modal
 * @param {string} props.featureName - Name of the feature being accessed (e.g., "chat", "notifications")
 * @param {string} props.returnUrl - URL to return to after login (optional)
 */
const AuthRequiredModal = ({
  open,
  onClose,
  featureName = "this feature",
  returnUrl,
}) => {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={400}
      closable={true}
    >
      <div className="text-center py-4">
        <ExclamationCircleOutlined className="text-6xl text-yellow-500 mb-4" />

        <Title level={4}>Yêu cầu đăng nhập</Title>

        <Text className="block mb-6">
          Vui lòng đăng nhập để sử dụng chức năng {featureName}.
        </Text>

        <Space direction="vertical" size="middle" className="w-full">
          <SignInButton redirectUrl={returnUrl || window.location.pathname}>
            <Button type="primary" size="large" block>
              Đăng nhập
            </Button>
          </SignInButton>

          <Button onClick={onClose} size="large" block>
            Quay lại
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default AuthRequiredModal;
