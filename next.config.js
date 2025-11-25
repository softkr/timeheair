/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  transpilePackages: ["antd", "@ant-design/icons", "@ant-design/charts"],
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
