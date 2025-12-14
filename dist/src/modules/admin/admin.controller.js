"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
let AdminController = class AdminController {
    constructor(configService) {
        this.configService = configService;
    }
    async getFacebookPages(accessToken, res) {
        if (!accessToken) {
            return res.send(this.getPagesListHTML());
        }
        try {
            const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`;
            const response = await axios_1.default.get(pagesUrl, {
                params: {
                    fields: 'id,name,instagram_business_account{id,username}',
                },
            });
            const pages = response.data.data || [];
            return res.json({
                success: true,
                message: 'Pages fetched successfully using pages_show_list permission',
                pages: pages.map((page) => ({
                    id: page.id,
                    name: page.name,
                    hasInstagram: !!page.instagram_business_account,
                    instagramAccount: page.instagram_business_account ? {
                        id: page.instagram_business_account.id,
                        username: page.instagram_business_account.username,
                    } : null,
                })),
                total: pages.length,
                permissionUsed: 'pages_show_list',
            });
        }
        catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message;
            return res.status(common_1.HttpStatus.BAD_REQUEST).json({
                success: false,
                error: errorMessage,
                hint: 'Make sure you have pages_show_list permission and are using a User Access Token (not Page Token)',
            });
        }
    }
    getPagesListHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facebook Pages List - pages_show_list Demo</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            width: 100%;
            padding: 40px;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
            font-size: 14px;
        }
        input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        input:focus {
            outline: none;
            border-color: #667eea;
        }
        button {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        button:active {
            transform: translateY(0);
        }
        .info {
            background: #f0f4ff;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin-top: 20px;
            border-radius: 4px;
            font-size: 13px;
            color: #555;
        }
        .info strong {
            color: #333;
        }
        .result {
            margin-top: 30px;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 8px;
            display: none;
        }
        .result.show {
            display: block;
        }
        .page-item {
            padding: 15px;
            background: white;
            border-radius: 8px;
            margin-bottom: 10px;
            border: 1px solid #e0e0e0;
        }
        .page-name {
            font-weight: 600;
            color: #333;
            margin-bottom: 5px;
        }
        .page-id {
            font-size: 12px;
            color: #999;
            font-family: monospace;
        }
        .instagram-badge {
            display: inline-block;
            background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            margin-top: 8px;
        }
        .loading {
            text-align: center;
            padding: 20px;
            color: #667eea;
        }
        .error {
            background: #fee;
            border-left: 4px solid #f44;
            padding: 15px;
            border-radius: 4px;
            color: #c33;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📄 Facebook Pages List</h1>
        <p class="subtitle">Demonstrating pages_show_list permission usage</p>
        
        <form id="pagesForm">
            <div class="form-group">
                <label for="accessToken">User Access Token (with pages_show_list permission)</label>
                <input 
                    type="text" 
                    id="accessToken" 
                    name="accessToken" 
                    placeholder="Enter your User Access Token"
                    required
                />
            </div>
            <button type="submit">Fetch My Pages</button>
        </form>

        <div class="info">
            <strong>How to get a User Access Token:</strong><br>
            1. Go to <a href="https://developers.facebook.com/tools/explorer/" target="_blank">Graph API Explorer</a><br>
            2. Select your app<br>
            3. Get User Token with <code>pages_show_list</code> permission<br>
            4. Copy the token and paste it above
        </div>

        <div id="result" class="result">
            <div id="resultContent"></div>
        </div>
    </div>

    <script>
        document.getElementById('pagesForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = document.getElementById('accessToken').value;
            const resultDiv = document.getElementById('result');
            const resultContent = document.getElementById('resultContent');
            
            resultDiv.classList.add('show');
            resultContent.innerHTML = '<div class="loading">⏳ Fetching Pages...</div>';

            try {
                const response = await fetch(\`/api/admin/facebook-pages?access_token=\${encodeURIComponent(token)}\`);
                const data = await response.json();

                if (data.success) {
                    let html = \`
                        <h3 style="margin-bottom: 15px; color: #333;">✅ Found \${data.total} Page(s)</h3>
                        <p style="margin-bottom: 20px; color: #666; font-size: 14px;">
                            This demonstrates the <strong>pages_show_list</strong> permission in action.
                        </p>
                    \`;
                    
                    data.pages.forEach(page => {
                        html += \`
                            <div class="page-item">
                                <div class="page-name">📄 \${page.name}</div>
                                <div class="page-id">ID: \${page.id}</div>
                                \${page.hasInstagram ? 
                                    \`<div class="instagram-badge">📷 Instagram: @\${page.instagramAccount.username}</div>\` 
                                    : '<div style="margin-top: 8px; color: #999; font-size: 12px;">No Instagram Business Account connected</div>'
                                }
                            </div>
                        \`;
                    });

                    resultContent.innerHTML = html;
                } else {
                    resultContent.innerHTML = \`
                        <div class="error">
                            <strong>❌ Error:</strong> \${data.error || 'Unknown error'}<br>
                            <small>\${data.hint || ''}</small>
                        </div>
                    \`;
                }
            } catch (error) {
                resultContent.innerHTML = \`
                    <div class="error">
                        <strong>❌ Request Failed:</strong> \${error.message}
                    </div>
                \`;
            }
        });
    </script>
</body>
</html>
    `;
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('facebook-pages'),
    __param(0, (0, common_1.Query)('access_token')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getFacebookPages", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map