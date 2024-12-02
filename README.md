# CodeStarter - Hypercontext Generator

**CodeStarter** is a powerful Visual Studio Code extension that leverages **StackSpot AI** to inject hypercontext and generate advanced code efficiently. Simplify your development process by defining your application's context and generating custom code with just a few clicks.

---

## Key Features

- **Hypercontext Injection**: Automatically adds relevant context to the code generation process.
- **Advanced Code Generation**: Create different types of code (e.g., tests, endpoints, etc.) based on the selected context.
- **Credential Manager**: Securely configure and manage your API credentials.
- **Seamless Integration**: Fully integrated with Visual Studio Code for a smooth user experience.

---

## How to Use

1. **Set Up Credentials**:
   - Access the `Secrets Manager` panel and input your API credentials (`Client ID`, `Client Secret`, and `Grant Type`).

2. **Select Context**:
   - Choose the files in your workspace that represent the application's context.

3. **Generate Code**:
   - Click the `Generate Code` button and select the type of code you want to generate.

> **Tip**: Use the `Secrets Manager` panel to securely store and manage your credentials.

---

## Requirements

- **StackSpot Account**: Ensure you have valid credentials to access StackSpot AI services.
- **Internet Connection**: Required for token generation and code generation requests.

---

## Extension Settings

This extension contributes the following settings:

- `codeStarter.enable`: Enable/disable the extension.
- `codeStarter.apiCredentials`: Configure API credentials for secure access.

---

## Known Issues

- **Token Expiration**: Ensure your tokens are valid. If they expire, generate new tokens using the `Secrets Manager`.
- **File Selection**: Only files within the workspace can be selected as context.

---

## Release Notes

### Version 0.0.1
- Initial release of **CodeStarter**.
- Features: hypercontext injection, advanced code generation, and secure credential management.

---

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests on the official repository.

---

## Support

If you encounter any issues or have questions, contact us via the [official repository](https://github.com/erkylima) or email us at.

---

**Enjoy CodeStarter and accelerate your development!**