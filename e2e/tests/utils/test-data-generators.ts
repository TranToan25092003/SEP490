export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'phone'
  | 'licensePlate'
  | 'number'
  | 'price'
  | 'year'
  | 'url'
  | 'textarea'
  | 'select'
  | 'date'
  | 'file';

export interface NegativeTestCase {
  name: string;
  value: string | number | null | undefined;
  expectedError?: string | RegExp;
  description: string;
}

export interface PositiveTestCase {
  name: string;
  value: string | number;
  description: string;
}

export interface FieldConfig {
  fieldType: FieldType;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  customCases?: NegativeTestCase[];
  customPositiveCases?: PositiveTestCase[];
  // File input specific options
  acceptedFileTypes?: string[]; // e.g., ['image/png', 'image/jpeg', '.pdf']
  maxFileSize?: number; // in bytes
  minFileSize?: number; // in bytes
  multiple?: boolean;
}

export const EMPTY_VALUE_CASES: NegativeTestCase[] = [
  {
    name: 'empty_string',
    value: '',
    description: 'Empty string should trigger required validation',
  },
  {
    name: 'whitespace_only',
    value: '   ',
    description: 'Whitespace-only input should be treated as empty',
  },
  {
    name: 'tab_characters',
    value: '\t\t',
    description: 'Tab characters should be treated as empty',
  },
  {
    name: 'newline_only',
    value: '\n',
    description: 'Newline-only input should be treated as empty',
  },
];

export const XSS_INJECTION_CASES: NegativeTestCase[] = [
  {
    name: 'script_tag',
    value: '<script>alert("xss")</script>',
    description: 'Script tag injection attempt',
  },
  {
    name: 'img_onerror',
    value: '<img src="x" onerror="alert(1)">',
    description: 'Image onerror injection attempt',
  },
  {
    name: 'javascript_url',
    value: 'javascript:alert(1)',
    description: 'JavaScript URL injection attempt',
  },
  {
    name: 'sql_injection',
    value: "'; DROP TABLE users; --",
    description: 'SQL injection attempt',
  },
  {
    name: 'html_entities',
    value: '&lt;script&gt;alert(1)&lt;/script&gt;',
    description: 'HTML entities injection attempt',
  },
];

export const SPECIAL_CHAR_CASES: NegativeTestCase[] = [
  {
    name: 'unicode_null',
    value: 'test\u0000value',
    description: 'Unicode null character in string',
  },
  {
    name: 'emoji',
    value: '😀🎉🚗',
    description: 'Emoji characters',
  },
  {
    name: 'rtl_override',
    value: '\u202Ereversed',
    description: 'Right-to-left override character',
  },
  {
    name: 'zero_width_space',
    value: 'test\u200Bvalue',
    description: 'Zero-width space in string',
  },
  {
    name: 'combining_chars',
    value: 'tëst̃',
    description: 'Combining diacritical marks',
  },
];

export const EMAIL_NEGATIVE_CASES: NegativeTestCase[] = [
  {
    name: 'no_at_symbol',
    value: 'invalidemail.com',
    expectedError: /email|không hợp lệ|invalid/i,
    description: 'Email without @ symbol',
  },
  {
    name: 'no_domain',
    value: 'invalid@',
    expectedError: /email|không hợp lệ|invalid/i,
    description: 'Email without domain',
  },
  {
    name: 'no_username',
    value: '@domain.com',
    expectedError: /email|không hợp lệ|invalid/i,
    description: 'Email without username',
  },
  {
    name: 'double_at',
    value: 'user@@domain.com',
    expectedError: /email|không hợp lệ|invalid/i,
    description: 'Email with double @ symbol',
  },
  {
    name: 'spaces_in_email',
    value: 'user name@domain.com',
    expectedError: /email|không hợp lệ|invalid/i,
    description: 'Email with spaces',
  },
  {
    name: 'no_tld',
    value: 'user@domain',
    expectedError: /email|không hợp lệ|invalid/i,
    description: 'Email without TLD',
  },
  {
    name: 'special_chars',
    value: 'user<>@domain.com',
    expectedError: /email|không hợp lệ|invalid/i,
    description: 'Email with invalid special characters',
  },
  {
    name: 'multiple_dots',
    value: 'user@domain..com',
    expectedError: /email|không hợp lệ|invalid/i,
    description: 'Email with consecutive dots',
  },
];

export const PHONE_NEGATIVE_CASES: NegativeTestCase[] = [
  {
    name: 'too_short',
    value: '098765',
    expectedError: /số điện thoại|phone|không hợp lệ/i,
    description: 'Phone number too short (less than 10 digits)',
  },
  {
    name: 'too_long',
    value: '098765432123456',
    expectedError: /số điện thoại|phone|không hợp lệ/i,
    description: 'Phone number too long (more than 11 digits)',
  },
  {
    name: 'letters_included',
    value: '098765abc1',
    expectedError: /số điện thoại|phone|không hợp lệ/i,
    description: 'Phone number with letters',
  },
  {
    name: 'special_chars',
    value: '0987-654-321',
    expectedError: /số điện thoại|phone|không hợp lệ/i,
    description: 'Phone number with dashes (may be invalid)',
  },
  {
    name: 'spaces',
    value: '098 765 4321',
    expectedError: /số điện thoại|phone|không hợp lệ/i,
    description: 'Phone number with spaces',
  },
  {
    name: 'leading_plus',
    value: '+84987654321',
    expectedError: /số điện thoại|phone|không hợp lệ/i,
    description: 'Phone with international prefix (may need different format)',
  },
  {
    name: 'all_zeros',
    value: '0000000000',
    expectedError: /số điện thoại|phone|không hợp lệ/i,
    description: 'Phone number all zeros',
  },
];

export const LICENSE_PLATE_NEGATIVE_CASES: NegativeTestCase[] = [
  {
    name: 'wrong_format_no_dash',
    value: '29G112345',
    expectedError: /biển số|license|không hợp lệ|định dạng/i,
    description: 'License plate without dashes',
  },
  {
    name: 'lowercase_letters',
    value: '29-g1-12345',
    expectedError: /biển số|license|không hợp lệ|định dạng/i,
    description: 'License plate with lowercase letters',
  },
  {
    name: 'too_short',
    value: '29-G1-123',
    expectedError: /biển số|license|không hợp lệ|định dạng/i,
    description: 'License plate too short',
  },
  {
    name: 'too_long',
    value: '29-G1-1234567',
    expectedError: /biển số|license|không hợp lệ|quá dài/i,
    description: 'License plate too long',
  },
  {
    name: 'invalid_province',
    value: '99-G1-12345',
    expectedError: /biển số|license|không hợp lệ/i,
    description: 'License plate with invalid province code',
  },
  {
    name: 'special_chars',
    value: '29-G1@12345',
    expectedError: /biển số|license|không hợp lệ/i,
    description: 'License plate with special characters',
  },
  {
    name: 'spaces',
    value: '29 G1 12345',
    expectedError: /biển số|license|không hợp lệ/i,
    description: 'License plate with spaces instead of dashes',
  },
];

export const PASSWORD_NEGATIVE_CASES: NegativeTestCase[] = [
  {
    name: 'too_short',
    value: '12345',
    expectedError: /mật khẩu|password|ít nhất|minimum|short/i,
    description: 'Password too short',
  },
  {
    name: 'common_password',
    value: 'password123',
    expectedError: /mật khẩu|password|yếu|weak/i,
    description: 'Common weak password',
  },
  {
    name: 'no_numbers',
    value: 'abcdefghij',
    expectedError: /mật khẩu|password|số|number/i,
    description: 'Password without numbers (if required)',
  },
  {
    name: 'no_uppercase',
    value: 'password123',
    expectedError: /mật khẩu|password|chữ hoa|uppercase/i,
    description: 'Password without uppercase (if required)',
  },
  {
    name: 'no_special_char',
    value: 'Password123',
    expectedError: /mật khẩu|password|ký tự đặc biệt|special/i,
    description: 'Password without special character (if required)',
  },
  {
    name: 'spaces_only',
    value: '        ',
    expectedError: /mật khẩu|password|bắt buộc|required/i,
    description: 'Password with only spaces',
  },
];

export const NUMBER_NEGATIVE_CASES: NegativeTestCase[] = [
  {
    name: 'negative_number',
    value: -100,
    expectedError: /không thể âm|negative|phải >= 0|lớn hơn 0/i,
    description: 'Negative number',
  },
  {
    name: 'text_instead_of_number',
    value: 'abc',
    expectedError: /số|number|phải là/i,
    description: 'Text instead of number',
  },
  {
    name: 'too_large',
    value: 999999999999999,
    expectedError: /quá lớn|too large|maximum/i,
    description: 'Extremely large number',
  },
  {
    name: 'special_number_values',
    value: 'NaN',
    expectedError: /số|number|không hợp lệ/i,
    description: 'NaN string value',
  },
];

export const YEAR_NEGATIVE_CASES: NegativeTestCase[] = [
  {
    name: 'year_too_old',
    value: '1800',
    expectedError: /năm|year|1900|không hợp lệ/i,
    description: 'Year before 1900',
  },
  {
    name: 'year_in_future',
    value: '2030',
    expectedError: /năm|year|tương lai|future/i,
    description: 'Year too far in future',
  },
  {
    name: 'not_four_digits',
    value: '99',
    expectedError: /năm|year|4 chữ số|không hợp lệ/i,
    description: 'Year not 4 digits',
  },
  {
    name: 'letters_in_year',
    value: '20ab',
    expectedError: /năm|year|số|không hợp lệ/i,
    description: 'Year with letters',
  },
  {
    name: 'negative_year',
    value: '-2020',
    expectedError: /năm|year|không hợp lệ/i,
    description: 'Negative year',
  },
];

export const URL_NEGATIVE_CASES: NegativeTestCase[] = [
  {
    name: 'no_protocol',
    value: 'www.example.com',
    expectedError: /url|đường dẫn|không hợp lệ/i,
    description: 'URL without protocol',
  },
  {
    name: 'invalid_protocol',
    value: 'ftp://example.com',
    expectedError: /url|đường dẫn|http/i,
    description: 'URL with non-http protocol',
  },
  {
    name: 'spaces_in_url',
    value: 'https://example .com',
    expectedError: /url|đường dẫn|không hợp lệ/i,
    description: 'URL with spaces',
  },
  {
    name: 'missing_domain',
    value: 'https://',
    expectedError: /url|đường dẫn|không hợp lệ/i,
    description: 'URL with missing domain',
  },
  {
    name: 'invalid_chars',
    value: 'https://exam<ple>.com',
    expectedError: /url|đường dẫn|không hợp lệ/i,
    description: 'URL with invalid characters',
  },
];

/**
 * Text field length test cases
 */
export const TEXT_LENGTH_CASES = {
  generateTooLong: (maxLength: number): NegativeTestCase => ({
    name: 'too_long',
    value: 'a'.repeat(maxLength + 1),
    expectedError: /quá dài|maximum|too long|tối đa/i,
    description: `Text exceeding ${maxLength} character limit`,
  }),
  generateTooShort: (minLength: number): NegativeTestCase => ({
    name: 'too_short',
    value: 'a'.repeat(Math.max(0, minLength - 1)),
    expectedError: /quá ngắn|minimum|too short|ít nhất/i,
    description: `Text below ${minLength} character minimum`,
  }),
};

export const DATE_NEGATIVE_CASES: NegativeTestCase[] = [
  {
    name: 'invalid_format',
    value: '2024/13/45',
    expectedError: /ngày|date|không hợp lệ|invalid/i,
    description: 'Invalid date format',
  },
  {
    name: 'impossible_date',
    value: '2024-02-30',
    expectedError: /ngày|date|không hợp lệ|invalid/i,
    description: 'Impossible date (Feb 30)',
  },
  {
    name: 'past_date_when_future_required',
    value: '2020-01-01',
    expectedError: /quá khứ|past|tương lai|future/i,
    description: 'Past date when future is required',
  },
  {
    name: 'future_date_when_past_required',
    value: '2030-12-31',
    expectedError: /tương lai|future|quá khứ|past/i,
    description: 'Future date when past is required',
  },
];

export const TEXTAREA_NEGATIVE_CASES: NegativeTestCase[] = [
  {
    name: 'script_injection',
    value: '<script>alert(1)</script>',
    description: 'Script injection attempt in textarea',
  },
];

export const SELECT_NEGATIVE_CASES: NegativeTestCase[] = [
  {
    name: 'no_selection',
    value: '',
    description: 'No selection made',
  }
];

export const FILE_NEGATIVE_CASES: NegativeTestCase[] = [
  {
    name: 'no_file_selected',
    value: '',
    expectedError: /chọn file|file.*bắt buộc|please select|required/i,
    description: 'No file selected',
  },
  {
    name: 'invalid_file_type',
    value: 'test.exe',
    expectedError: /loại file|file type|định dạng|format|không hỗ trợ|not supported/i,
    description: 'Invalid file type (executable)',
  },
  {
    name: 'invalid_extension_txt',
    value: 'document.txt',
    expectedError: /loại file|file type|định dạng|format|không hỗ trợ|not supported/i,
    description: 'Text file when images expected',
  },
  {
    name: 'file_too_large',
    value: 'large_file_10mb.jpg',
    expectedError: /quá lớn|too large|kích thước|size|maximum|tối đa/i,
    description: 'File exceeds maximum size limit',
  },
  {
    name: 'file_too_small',
    value: 'tiny_file.jpg',
    expectedError: /quá nhỏ|too small|kích thước|size|minimum|tối thiểu/i,
    description: 'File below minimum size',
  },
  {
    name: 'corrupted_file',
    value: 'corrupted.jpg',
    expectedError: /hỏng|corrupted|không thể đọc|cannot read|invalid/i,
    description: 'Corrupted or invalid file',
  },
  {
    name: 'hidden_extension',
    value: 'image.jpg.exe',
    expectedError: /loại file|file type|không hợp lệ|invalid/i,
    description: 'File with hidden malicious extension',
  },
  {
    name: 'empty_file',
    value: 'empty.jpg',
    expectedError: /rỗng|empty|không có dữ liệu|no data/i,
    description: 'Empty file with zero bytes',
  },
  {
    name: 'special_chars_filename',
    value: 'file<script>.jpg',
    expectedError: /tên file|filename|ký tự|character|không hợp lệ|invalid/i,
    description: 'Filename with special/malicious characters',
  },
  {
    name: 'very_long_filename',
    value: 'a'.repeat(256) + '.jpg',
    expectedError: /tên file|filename|quá dài|too long/i,
    description: 'Filename exceeding maximum length',
  },
];

// ==================== POSITIVE TEST CASES ====================

export const EMAIL_POSITIVE_CASES: PositiveTestCase[] = [
  {
    name: 'standard_email',
    value: 'user@example.com',
    description: 'Standard email format',
  },
  {
    name: 'email_with_subdomain',
    value: 'user@mail.example.com',
    description: 'Email with subdomain',
  },
  {
    name: 'email_with_plus',
    value: 'user+tag@example.com',
    description: 'Email with plus sign for aliasing',
  },
  {
    name: 'email_with_dots',
    value: 'user.name@example.com',
    description: 'Email with dots in username',
  },
  {
    name: 'email_with_numbers',
    value: 'user123@example.com',
    description: 'Email with numbers',
  },
  {
    name: 'email_long_tld',
    value: 'user@example.company',
    description: 'Email with longer TLD',
  },
];

export const PHONE_POSITIVE_CASES: PositiveTestCase[] = [
  {
    name: 'valid_10_digits',
    value: '0987654321',
    description: 'Valid 10-digit phone number',
  },
  {
    name: 'valid_11_digits',
    value: '01234567890',
    description: 'Valid 11-digit phone number',
  },
  {
    name: 'viettel_prefix',
    value: '0961234567',
    description: 'Valid Viettel phone number',
  },
  {
    name: 'vinaphone_prefix',
    value: '0911234567',
    description: 'Valid Vinaphone phone number',
  },
  {
    name: 'mobifone_prefix',
    value: '0901234567',
    description: 'Valid Mobifone phone number',
  },
];

export const LICENSE_PLATE_POSITIVE_CASES: PositiveTestCase[] = [
  {
    name: 'hanoi_plate',
    value: '29-G1-12345',
    description: 'Valid Hanoi license plate',
  },
  {
    name: 'hcm_plate',
    value: '51-A1-12345',
    description: 'Valid Ho Chi Minh City license plate',
  },
  {
    name: 'danang_plate',
    value: '43-B1-12345',
    description: 'Valid Da Nang license plate',
  },
  {
    name: 'four_digit_number',
    value: '29-G1-1234',
    description: 'License plate with 4-digit number',
  },
  {
    name: 'five_digit_number',
    value: '29-G1-12345',
    description: 'License plate with 5-digit number',
  },
];

export const PASSWORD_POSITIVE_CASES: PositiveTestCase[] = [
  {
    name: 'strong_password',
    value: 'SecurePass@123',
    description: 'Strong password with uppercase, lowercase, number, and special char',
  },
  {
    name: 'minimum_valid_length',
    value: 'Pass@123',
    description: 'Password meeting minimum length requirement',
  },
  {
    name: 'long_secure_password',
    value: 'VerySecurePassword@2024!',
    description: 'Long secure password',
  },
  {
    name: 'with_special_chars',
    value: 'Test!@#$%^&*',
    description: 'Password with multiple special characters',
  },
];

export const NUMBER_POSITIVE_CASES: PositiveTestCase[] = [
  {
    name: 'positive_integer',
    value: 100,
    description: 'Valid positive integer',
  },
  {
    name: 'zero',
    value: 0,
    description: 'Zero value (when allowed)',
  },
  {
    name: 'decimal_number',
    value: 123.45,
    description: 'Valid decimal number',
  },
  {
    name: 'large_number',
    value: 1000000,
    description: 'Large valid number',
  },
  {
    name: 'small_positive',
    value: 1,
    description: 'Smallest positive integer',
  },
];

export const PRICE_POSITIVE_CASES: PositiveTestCase[] = [
  {
    name: 'standard_price',
    value: 500000,
    description: 'Standard price value',
  },
  {
    name: 'minimum_price',
    value: 1000,
    description: 'Minimum valid price',
  },
  {
    name: 'large_price',
    value: 100000000,
    description: 'Large price value',
  },
  {
    name: 'price_with_decimals',
    value: 150000.5,
    description: 'Price with decimal places',
  },
];

export const YEAR_POSITIVE_CASES: PositiveTestCase[] = [
  {
    name: 'current_year',
    value: new Date().getFullYear().toString(),
    description: 'Current year',
  },
  {
    name: 'recent_year',
    value: '2023',
    description: 'Recent past year',
  },
  {
    name: 'older_year',
    value: '2010',
    description: 'Older valid year',
  },
  {
    name: 'minimum_valid_year',
    value: '1990',
    description: 'Minimum valid year for most vehicles',
  },
  {
    name: 'classic_car_year',
    value: '1970',
    description: 'Classic car year',
  },
];

export const URL_POSITIVE_CASES: PositiveTestCase[] = [
  {
    name: 'https_url',
    value: 'https://example.com',
    description: 'Standard HTTPS URL',
  },
  {
    name: 'http_url',
    value: 'http://example.com',
    description: 'Standard HTTP URL',
  },
  {
    name: 'url_with_path',
    value: 'https://example.com/path/to/page',
    description: 'URL with path',
  },
  {
    name: 'url_with_query',
    value: 'https://example.com/page?param=value',
    description: 'URL with query parameters',
  },
  {
    name: 'url_with_subdomain',
    value: 'https://www.example.com',
    description: 'URL with www subdomain',
  },
];

export const TEXT_POSITIVE_CASES: PositiveTestCase[] = [
  {
    name: 'standard_text',
    value: 'Valid text input',
    description: 'Standard text input',
  },
  {
    name: 'text_with_vietnamese',
    value: 'Nguyễn Văn An',
    description: 'Vietnamese text with diacritics',
  },
  {
    name: 'alphanumeric',
    value: 'ABC123',
    description: 'Alphanumeric text',
  },
  {
    name: 'text_with_spaces',
    value: 'Hello World',
    description: 'Text with spaces',
  },
];

export const TEXTAREA_POSITIVE_CASES: PositiveTestCase[] = [
  {
    name: 'single_line',
    value: 'This is a single line description.',
    description: 'Single line textarea content',
  },
  {
    name: 'multi_line',
    value: 'Line 1\nLine 2\nLine 3',
    description: 'Multi-line textarea content',
  },
  {
    name: 'detailed_description',
    value: 'This is a detailed description that provides comprehensive information about the subject matter.',
    description: 'Detailed description text',
  },
  {
    name: 'vietnamese_content',
    value: 'Đây là nội dung mô tả bằng tiếng Việt với các ký tự đặc biệt.',
    description: 'Vietnamese content in textarea',
  },
];

export const DATE_POSITIVE_CASES: PositiveTestCase[] = [
  {
    name: 'today',
    value: new Date().toISOString().split('T')[0],
    description: 'Today\'s date',
  },
  {
    name: 'future_date',
    value: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'Date one week in the future',
  },
  {
    name: 'past_date',
    value: '2023-06-15',
    description: 'Valid past date',
  },
  {
    name: 'beginning_of_year',
    value: '2024-01-01',
    description: 'First day of year',
  },
  {
    name: 'end_of_year',
    value: '2024-12-31',
    description: 'Last day of year',
  },
];

export const FILE_POSITIVE_CASES: PositiveTestCase[] = [
  {
    name: 'valid_jpeg_image',
    value: 'valid_image.jpg',
    description: 'Valid JPEG image file',
  },
  {
    name: 'valid_png_image',
    value: 'valid_image.png',
    description: 'Valid PNG image file',
  },
  {
    name: 'valid_gif_image',
    value: 'valid_image.gif',
    description: 'Valid GIF image file',
  },
  {
    name: 'valid_webp_image',
    value: 'valid_image.webp',
    description: 'Valid WebP image file',
  },
  {
    name: 'valid_pdf_document',
    value: 'valid_document.pdf',
    description: 'Valid PDF document',
  },
  {
    name: 'valid_small_file',
    value: 'small_file.jpg',
    description: 'Valid small-sized file',
  },
  {
    name: 'valid_max_size_file',
    value: 'max_size_file.jpg',
    description: 'File at maximum allowed size',
  },
  {
    name: 'valid_filename_with_spaces',
    value: 'my image file.jpg',
    description: 'Valid file with spaces in filename',
  },
  {
    name: 'valid_unicode_filename',
    value: 'hình_ảnh_xe.jpg',
    description: 'Valid file with Vietnamese characters in filename',
  },
];

/**
 * Text field positive length test cases
 */
export const TEXT_LENGTH_POSITIVE_CASES = {
  generateAtMinLength: (minLength: number): PositiveTestCase => ({
    name: 'at_min_length',
    value: 'a'.repeat(minLength),
    description: `Text at minimum length (${minLength} characters)`,
  }),
  generateAtMaxLength: (maxLength: number): PositiveTestCase => ({
    name: 'at_max_length',
    value: 'a'.repeat(maxLength),
    description: `Text at maximum length (${maxLength} characters)`,
  }),
  generateMiddleLength: (minLength: number, maxLength: number): PositiveTestCase => ({
    name: 'middle_length',
    value: 'a'.repeat(Math.floor((minLength + maxLength) / 2)),
    description: `Text at middle of valid range`,
  }),
};

/**
 * Get positive test cases for a given field configuration
 */
export function getPositiveCasesForField(config: FieldConfig): PositiveTestCase[] {
  const cases: PositiveTestCase[] = [];

  switch (config.fieldType) {
    case 'email':
      cases.push(...EMAIL_POSITIVE_CASES);
      break;
    case 'phone':
      cases.push(...PHONE_POSITIVE_CASES);
      break;
    case 'licensePlate':
      cases.push(...LICENSE_PLATE_POSITIVE_CASES);
      break;
    case 'password':
      cases.push(...PASSWORD_POSITIVE_CASES);
      break;
    case 'number':
      cases.push(...NUMBER_POSITIVE_CASES);
      break;
    case 'price':
      cases.push(...PRICE_POSITIVE_CASES);
      break;
    case 'year':
      cases.push(...YEAR_POSITIVE_CASES);
      break;
    case 'url':
      cases.push(...URL_POSITIVE_CASES);
      break;
    case 'text':
      cases.push(...TEXT_POSITIVE_CASES);
      if (config.minLength) {
        cases.push(TEXT_LENGTH_POSITIVE_CASES.generateAtMinLength(config.minLength));
      }
      if (config.maxLength) {
        cases.push(TEXT_LENGTH_POSITIVE_CASES.generateAtMaxLength(config.maxLength));
      }
      if (config.minLength && config.maxLength) {
        cases.push(TEXT_LENGTH_POSITIVE_CASES.generateMiddleLength(config.minLength, config.maxLength));
      }
      break;
    case 'textarea':
      cases.push(...TEXTAREA_POSITIVE_CASES);
      break;
    case 'date':
      cases.push(...DATE_POSITIVE_CASES);
      break;
    case 'file':
      cases.push(...getFilePositiveCasesForConfig(config));
      break;
    case 'select':
      // Select positive cases are typically handled by providing valid option values
      break;
  }

  // Add boundary positive cases for number fields
  if ((config.fieldType === 'number' || config.fieldType === 'price') && config.min !== undefined && config.max !== undefined) {
    cases.push(...generateBoundaryPositiveTestCases(config.min, config.max));
  }

  if (config.customPositiveCases) {
    cases.push(...config.customPositiveCases);
  }

  return cases;
}

/**
 * Generate boundary positive test cases for numeric fields
 */
export function generateBoundaryPositiveTestCases(min: number, max: number): PositiveTestCase[] {
  return [
    {
      name: 'at_minimum',
      value: min,
      description: `Value at minimum boundary (${min})`,
    },
    {
      name: 'at_maximum',
      value: max,
      description: `Value at maximum boundary (${max})`,
    },
    {
      name: 'middle_value',
      value: Math.floor((min + max) / 2),
      description: `Value in the middle of range (${Math.floor((min + max) / 2)})`,
    },
    {
      name: 'just_above_minimum',
      value: min + 1,
      description: `Value just above minimum (${min + 1})`,
    },
    {
      name: 'just_below_maximum',
      value: max - 1,
      description: `Value just below maximum (${max - 1})`,
    },
  ];
}

export function getNegativeCasesForField(config: FieldConfig): NegativeTestCase[] {
  const cases: NegativeTestCase[] = [];

  if (config.required && config.fieldType !== 'file' && config.fieldType !== 'select') {
    cases.push(...EMPTY_VALUE_CASES);
  }

  switch (config.fieldType) {
    case 'email':
      cases.push(...EMAIL_NEGATIVE_CASES);
      break;
    case 'phone':
      cases.push(...PHONE_NEGATIVE_CASES);
      break;
    case 'licensePlate':
      cases.push(...LICENSE_PLATE_NEGATIVE_CASES);
      break;
    case 'password':
      cases.push(...PASSWORD_NEGATIVE_CASES);
      break;
    case 'number':
    case 'price':
      cases.push(...NUMBER_NEGATIVE_CASES);
      break;
    case 'year':
      cases.push(...YEAR_NEGATIVE_CASES);
      break;
    case 'url':
      cases.push(...URL_NEGATIVE_CASES);
      break;
    case 'textarea':
      cases.push(...TEXTAREA_NEGATIVE_CASES);
      break;
    case 'select':
      cases.push(...SELECT_NEGATIVE_CASES);
      break;
    case 'date':
      cases.push(...DATE_NEGATIVE_CASES);
      break;
    case 'file':
      cases.push(...getFileNegativeCasesForConfig(config));
      break;
    default:
      if (config.maxLength) {
        cases.push(TEXT_LENGTH_CASES.generateTooLong(config.maxLength));
      }
      if (config.minLength && config.minLength > 1) {
        cases.push(TEXT_LENGTH_CASES.generateTooShort(config.minLength));
      }
      break;
  }

  if (config.customCases) {
    cases.push(...config.customCases);
  }

  return cases;
}

export function generateBoundaryTestCases(min: number, max: number): NegativeTestCase[] {
  return [
    {
      name: 'below_minimum',
      value: min - 1,
      expectedError: /tối thiểu|minimum|phải >= |phải lớn hơn/i,
      description: `Value below minimum (${min - 1})`,
    },
    {
      name: 'above_maximum',
      value: max + 1,
      expectedError: /tối đa|maximum|phải <= |quá lớn/i,
      description: `Value above maximum (${max + 1})`,
    },
    {
      name: 'at_minimum_boundary',
      value: min,
      description: `Value at minimum boundary (${min}) - should be valid`,
    },
    {
      name: 'at_maximum_boundary',
      value: max,
      description: `Value at maximum boundary (${max}) - should be valid`,
    },
  ];
}

export interface TestCaseResult {
  caseName: string;
  passed: boolean;
  actualError?: string;
  expectedError?: string | RegExp;
  value: string | number | null | undefined;
}

export interface PositiveTestCaseResult {
  caseName: string;
  passed: boolean;
  value: string | number;
  errorMessage?: string;
}

export function createTestSuiteName(formName: string, fieldName: string): string {
  return `${formName} - ${fieldName} Negative Cases`;
}

export function createPositiveTestSuiteName(formName: string, fieldName: string): string {
  return `${formName} - ${fieldName} Positive Cases`;
}

export const VI_ERROR_MESSAGES = {
  required: /bắt buộc|không được để trống|vui lòng nhập|required/i,
  email: /email không hợp lệ|invalid email/i,
  phone: /số điện thoại không hợp lệ|invalid phone/i,
  minLength: /ít nhất|minimum|quá ngắn/i,
  maxLength: /tối đa|maximum|quá dài/i,
  min: /phải >= |phải lớn hơn|không thể âm/i,
  max: /phải <= |quá lớn|vượt quá/i,
  pattern: /không hợp lệ|định dạng|invalid format/i,
  licensePlate: /biển số.*không hợp lệ|định dạng biển số/i,
  fileType: /loại file|file type|định dạng|format|không hỗ trợ|not supported/i,
  fileSize: /kích thước|size|quá lớn|too large|quá nhỏ|too small/i,
  fileRequired: /chọn file|file.*bắt buộc|please select/i,
};

export const FILE_SIZE_CASES = {
  generateTooLarge: (maxSize: number): NegativeTestCase => ({
    name: 'file_exceeds_max_size',
    value: `large_file_${Math.ceil(maxSize / 1024 / 1024) + 1}mb.jpg`,
    expectedError: /quá lớn|too large|kích thước|size|maximum|tối đa/i,
    description: `File exceeding ${Math.ceil(maxSize / 1024 / 1024)}MB limit`,
  }),
  generateTooSmall: (minSize: number): NegativeTestCase => ({
    name: 'file_below_min_size',
    value: 'tiny_file.jpg',
    expectedError: /quá nhỏ|too small|kích thước|size|minimum|tối thiểu/i,
    description: `File below ${minSize} bytes minimum`,
  }),
};

export const FILE_TYPE_CASES = {
  generateInvalidType: (acceptedTypes: string[]): NegativeTestCase => ({
    name: 'invalid_file_type',
    value: 'document.exe',
    expectedError: /loại file|file type|định dạng|format|không hỗ trợ|not supported/i,
    description: `Invalid file type. Accepted: ${acceptedTypes.join(', ')}`,
  }),
};

export function getFileNegativeCasesForConfig(config: FieldConfig): NegativeTestCase[] {
  const cases: NegativeTestCase[] = [];

  if (config.required) {
    cases.push({
      name: 'no_file_selected',
      value: '',
      expectedError: /chọn file|file.*bắt buộc|please select|required/i,
      description: 'No file selected when required',
    });
  }

  if (config.acceptedFileTypes && config.acceptedFileTypes.length > 0) {
    cases.push(FILE_TYPE_CASES.generateInvalidType(config.acceptedFileTypes));
  }

  if (config.maxFileSize) {
    cases.push(FILE_SIZE_CASES.generateTooLarge(config.maxFileSize));
  }

  if (config.minFileSize) {
    cases.push(FILE_SIZE_CASES.generateTooSmall(config.minFileSize));
  }

  cases.push(
    {
      name: 'hidden_extension',
      value: 'image.jpg.exe',
      expectedError: /loại file|file type|không hợp lệ|invalid/i,
      description: 'File with hidden malicious extension',
    }
  );

  return cases;
}

export function getFilePositiveCasesForConfig(config: FieldConfig): PositiveTestCase[] {
  const cases: PositiveTestCase[] = [];

  if (config.acceptedFileTypes) {
    const typeMapping: Record<string, PositiveTestCase> = {
      'image/jpeg': { name: 'valid_jpeg', value: 'test_image.jpg', description: 'Valid JPEG image' },
      'image/jpg': { name: 'valid_jpg', value: 'test_image.jpg', description: 'Valid JPG image' },
      'image/png': { name: 'valid_png', value: 'test_image.png', description: 'Valid PNG image' },
      'image/gif': { name: 'valid_gif', value: 'test_image.gif', description: 'Valid GIF image' },
      'image/webp': { name: 'valid_webp', value: 'test_image.webp', description: 'Valid WebP image' },
      'application/pdf': { name: 'valid_pdf', value: 'test_document.pdf', description: 'Valid PDF document' },
      '.jpg': { name: 'valid_jpg_ext', value: 'test_image.jpg', description: 'Valid .jpg file' },
      '.jpeg': { name: 'valid_jpeg_ext', value: 'test_image.jpeg', description: 'Valid .jpeg file' },
      '.png': { name: 'valid_png_ext', value: 'test_image.png', description: 'Valid .png file' },
      '.pdf': { name: 'valid_pdf_ext', value: 'test_document.pdf', description: 'Valid .pdf file' },
      '.gif': { name: 'valid_gif_ext', value: 'test_image.gif', description: 'Valid .gif file' },
    };

    for (const type of config.acceptedFileTypes) {
      if (typeMapping[type]) {
        cases.push(typeMapping[type]);
      }
    }
  } else {
    cases.push(...FILE_POSITIVE_CASES);
  }

  return cases;
}
