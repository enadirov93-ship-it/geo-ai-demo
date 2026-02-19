module.exports = (req, res) => {
  res.status(200).json({
    ok: true,
    has_OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY),
    node_env: process.env.NODE_ENV || null
  });
};
