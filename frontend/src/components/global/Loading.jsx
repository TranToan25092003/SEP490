import { VscLoading } from "react-icons/vsc";
const Loading = () => {
  return (
    <>
      <div className="h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg">
          <VscLoading className="animate-spin"></VscLoading>
        </span>
      </div>
    </>
  );
};

export default Loading;
