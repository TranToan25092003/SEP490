module.exports = class DomainError extends Error {
  constructor(message, errorCode, statusCode = 400) {
    super(message);
    this.name = "DomainError";
    this.errorCode = errorCode;
    this.statusCode = statusCode;
  }
}
