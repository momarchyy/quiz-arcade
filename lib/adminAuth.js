export function isAdmin(request) {
  const pw = request.headers.get('x-admin-password');
  return Boolean(process.env.ADMIN_PASSWORD && pw === process.env.ADMIN_PASSWORD);
}
