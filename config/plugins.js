const allowedMediaTypes = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.*',
  'text/plain',
  'text/csv',
];

const deniedTypes = [
  'image/svg+xml',
  'application/vnd.microsoft.portable-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-sh',
  'text/x-shellscript',
  'application/x-mach-binary',
];

module.exports = ({ env }) => ({
  'users-permissions': {
    config: {
      jwtManagement: 'refresh',
      sessions: {
        httpOnly: true,
      },
    },
  },
  upload: {
    config: {
      // Media (fotos de la galeria, imatges de notícies...) es guarda a Supabase
      // Storage, no a disc local — Render (free) no té disc persistent, i això
      // evita dependre del pla de pagament amb disc.
      provider: 'aws-s3',
      providerOptions: {
        s3Options: {
          credentials: {
            accessKeyId: env('SUPABASE_S3_ACCESS_KEY_ID'),
            secretAccessKey: env('SUPABASE_S3_SECRET_ACCESS_KEY'),
          },
          endpoint: env('SUPABASE_S3_ENDPOINT'),
          region: env('SUPABASE_S3_REGION', 'us-east-1'),
          forcePathStyle: true,
          params: {
            Bucket: env('SUPABASE_S3_BUCKET', 'strapi-uploads'),
          },
        },
        baseUrl: env('SUPABASE_S3_PUBLIC_URL'),
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
      security: {
        allowedTypes: allowedMediaTypes,
        deniedTypes,
      },
    },
  },
});
