#!/bin/bash
# Docker 镜像构建和推送脚本（阿里云 Container Registry）
#
# 用法:
#   ./scripts/docker_build_and_push.sh [VERSION] [PASSWORD]
#
# 参数:
#   VERSION  - 镜像版本（可选，默认为 latest）
#   PASSWORD - Docker 登录密码（可选，也可以通过环境变量 DOCKER_PASSWORD 提供）
#
# 示例:
#   ./scripts/docker_build_and_push.sh                    # 使用 latest 版本，交互式输入密码
#   ./scripts/docker_build_and_push.sh v2.0.0             # 使用 v2.0.0 版本，交互式输入密码
#   ./scripts/docker_build_and_push.sh v2.0.0 mypassword   # 使用 v2.0.0 版本和指定密码
#   DOCKER_PASSWORD=mypassword ./scripts/docker_build_and_push.sh v2.0.0  # 使用环境变量
#
# 注意:
#   - 首次登录后，Docker 会将凭证保存到 ~/.docker/config.json
#   - 后续运行脚本时会自动检测并使用保存的凭证，无需再次输入密码
#   - 如果凭证过期，脚本会自动提示重新登录

set -e

# 配置变量
REGISTRY="registry.cn-hangzhou.aliyuncs.com"
USERNAME="ychy7001"
IMAGE_NAME="markmap-renderer"

# 判断是否提供了版本参数（第一个参数且不是 latest）
if [ -n "$1" ] && [ "$1" != "latest" ]; then
    VERSION="$1"
    PASSWORD="${2:-${DOCKER_PASSWORD:-}}"  # 从命令行参数或环境变量获取密码（可选）
    # 仅在提供版本参数且提供密码时才推送
    if [ -n "$PASSWORD" ]; then
        PUSH_IMAGE=true
    else
        PUSH_IMAGE=false
    fi
else
    VERSION="latest"
    PUSH_IMAGE=false
    # 如果第一个参数看起来像密码（不是版本号），也支持
    if [ -n "$1" ] && [[ ! "$1" =~ ^v[0-9] ]]; then
        PASSWORD="$1"
    else
        PASSWORD="${DOCKER_PASSWORD:-}"
    fi
fi

# 完整镜像地址
FULL_IMAGE_NAME="${REGISTRY}/${USERNAME}/${IMAGE_NAME}:${VERSION}"

echo "=========================================="
if [ "$PUSH_IMAGE" = true ]; then
    echo "Docker 镜像构建和推送"
else
    echo "Docker 镜像构建"
fi
echo "=========================================="
echo "镜像名称: ${IMAGE_NAME}"
echo "版本: ${VERSION}"
if [ "$PUSH_IMAGE" = true ]; then
    echo "完整地址: ${FULL_IMAGE_NAME}"
    echo "推送: 是"
else
    echo "推送: 否（仅本地构建）"
fi
echo ""

# 切换到项目根目录
cd "$(dirname "$0")/.."

# 1. 构建镜像（使用 BuildKit 以获得更好的缓存和性能）
echo "1. 构建 Docker 镜像（使用 BuildKit）..."
# 检查是否支持 BuildKit
if docker buildx version >/dev/null 2>&1; then
    echo "   使用 BuildKit 构建（推荐）..."
    DOCKER_BUILDKIT=1 docker build -t "${IMAGE_NAME}:${VERSION}" -t "${IMAGE_NAME}:latest" .
else
    echo "   BuildKit 不可用，使用传统构建..."
    docker build -t "${IMAGE_NAME}:${VERSION}" -t "${IMAGE_NAME}:latest" .
fi
echo "✅ 镜像构建成功"
echo ""

# 2. 标记镜像（仅在需要推送时）
if [ "$PUSH_IMAGE" = true ]; then
    echo "2. 标记镜像..."
    docker tag "${IMAGE_NAME}:${VERSION}" "${FULL_IMAGE_NAME}"
    echo "✅ 镜像标记成功: ${FULL_IMAGE_NAME}"
    echo ""
fi

# 3. 检查登录状态并登录（仅在需要推送时）
if [ "$PUSH_IMAGE" = true ]; then
    echo "3. 检查 Docker 登录状态..."

    # 检查是否已登录（通过尝试访问 registry 来验证）
    check_docker_login() {
        # 方法1: 检查 Docker 配置文件
        local config_file="${HOME}/.docker/config.json"
        if [ -f "${config_file}" ]; then
            # 检查是否包含该 registry 的认证信息
            if grep -q "\"${REGISTRY}\"" "${config_file}" 2>/dev/null || \
               grep -q "${REGISTRY}" "${config_file}" 2>/dev/null; then
                # 方法2: 尝试一个轻量级操作来验证认证是否有效
                # 使用 manifest inspect 来测试认证（不会实际拉取镜像，只检查认证）
                local test_output
                test_output=$(docker manifest inspect "${REGISTRY}/${USERNAME}/${IMAGE_NAME}:__login_test__" 2>&1)
                local exit_code=$?
                
                # 如果命令成功（即使镜像不存在，返回404也说明认证有效）
                if [ $exit_code -eq 0 ]; then
                    return 0  # 认证有效
                # 如果返回 401 或包含 unauthorized/authentication，说明认证无效
                elif echo "$test_output" | grep -qiE "unauthorized|authentication required|401|UNAUTHORIZED"; then
                    return 1  # 认证无效或过期
                # 如果返回 404（镜像不存在），说明认证是有效的（能访问registry但镜像不存在）
                elif echo "$test_output" | grep -qiE "manifest unknown|not found|404"; then
                    return 0  # 认证有效，只是镜像不存在
                else
                    # 其他错误，保守处理：认为需要登录
                    return 1
                fi
            fi
        fi
        return 1  # 未登录
    }

    NEED_LOGIN=true
    if check_docker_login; then
        NEED_LOGIN=false
    fi

    if [ "$NEED_LOGIN" = true ]; then
        echo "⚠️  需要登录阿里云 Container Registry"
        echo "   用户名: ${USERNAME}"
        
        if [ -n "$PASSWORD" ]; then
            # 使用提供的密码登录（通过 stdin 传递，更安全）
            echo "   使用提供的密码进行登录（非交互式）..."
            echo "$PASSWORD" | docker login --username="${USERNAME}" --password-stdin "${REGISTRY}"
            if [ $? -ne 0 ]; then
                echo "❌ 登录失败，请检查密码是否正确"
                exit 1
            fi
            echo "✅ 登录成功（使用提供的密码）"
        else
            # 交互式登录（Docker 会提示输入密码）
            echo "   密码: 请输入阿里云服务密码"
            echo ""
            echo "   💡 提示: 如果不想每次输入密码，可以使用以下方式："
            echo "   1. 通过命令行参数: $0 ${VERSION} <password>"
            echo "   2. 通过环境变量: export DOCKER_PASSWORD=<password>"
            echo "   3. 登录一次后，Docker 会保存凭证到 ~/.docker/config.json，下次无需再输入"
            echo ""
            docker login --username="${USERNAME}" "${REGISTRY}"
            if [ $? -ne 0 ]; then
                echo "❌ 登录失败"
                exit 1
            fi
            echo "✅ 登录成功"
            echo "💡 提示: 登录凭证已保存到 ~/.docker/config.json"
            echo "   下次运行脚本时会自动检测并使用保存的凭证，无需再次输入密码"
        fi
    else
        echo "✅ 已登录（使用保存的凭证）"
        echo "   Docker 凭证保存在 ~/.docker/config.json"
    fi
    echo ""

    # 4. 推送镜像
    echo "4. 推送镜像到 ${REGISTRY}..."
    docker push "${FULL_IMAGE_NAME}"
    echo "✅ 镜像推送成功"
    echo ""
fi

# 5. 显示镜像信息
echo "=========================================="
if [ "$PUSH_IMAGE" = true ]; then
    echo "✅ 镜像构建和推送完成！"
else
    echo "✅ 镜像构建完成！"
fi
echo "=========================================="
echo ""
echo "镜像信息："
echo "  本地镜像: ${IMAGE_NAME}:${VERSION}"
if [ "$PUSH_IMAGE" = true ]; then
    echo "  远程镜像: ${FULL_IMAGE_NAME}"
    echo ""
    echo "拉取镜像命令："
    echo "  docker pull ${FULL_IMAGE_NAME}"
    echo ""
    echo "运行容器命令（基础运行）："
    echo "  docker run -d \\"
    echo "    --name ${IMAGE_NAME} \\"
    echo "    -p 3000:3000 \\"
    echo "    ${FULL_IMAGE_NAME}"
else
    echo ""
    echo "运行容器命令（基础运行）："
    echo "  docker run -d \\"
    echo "    --name ${IMAGE_NAME} \\"
    echo "    -p 3000:3000 \\"
    echo "    ${IMAGE_NAME}:${VERSION}"
    echo ""
    echo "💡 提示: 如需推送到阿里云，请提供版本参数和密码，例如:"
    echo "  ./scripts/docker_build_and_push.sh v1.0.0 mypassword"
    echo "  或使用环境变量: DOCKER_PASSWORD=mypassword ./scripts/docker_build_and_push.sh v1.0.0"
fi
echo ""
