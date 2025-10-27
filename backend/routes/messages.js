const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/message');

// Create message
router.post('/', auth, async (req, res) => {
  const { name, message } = req.body;
  
  if (!name || !message) {
    return res.status(400).json({
      status: 'error',
      message: 'Name and message are required'
    });
  }

  try {
    await Message.create({
      name,
      message,
      userId: req.user.userId,
      username: req.user.username
    });
    
    res.json({
      status: 'success',
      message: `Thank you ${name}! Your message has been saved.`
    });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to save message. Please try again.'
    });
  }
});

// Get all messages
router.get('/', async (req, res) => {
  try {
    const { search, username } = req.query;
    const messages = await Message.findAll({ search, username });
    res.json({
      status: 'success',
      messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch messages'
    });
  }
});

// Delete message
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Message.deleteMessage(req.params.id, req.user.userId);
    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Message not found or you do not have permission to delete it'
      });
    }
    res.json({
      status: 'success',
      message: 'Message deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete message'
    });
  }
});

module.exports = router;