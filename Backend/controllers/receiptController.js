// controllers/receiptController.js
// Receipt Generation Route Handlers

const receiptService = require('../services/receiptService');

// Get Receipt
const getReceipt = async (req, res, next) => {
  try {
    const { saleId } = req.params;

    const receipt = await receiptService.generateReceipt(saleId);

    res.status(200).json({
      success: true,
      data: receipt
    });
  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Receipt not found'
    });
  }
};

// Get Receipt Text (for printing)
const getReceiptText = async (req, res, next) => {
  try {
    const { saleId } = req.params;

    const receipt = await receiptService.generateReceipt(saleId);
    const receiptText = receiptService.generateReceiptText(receipt);

    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(receiptText);
  } catch (error) {
    console.error('Get receipt text error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Receipt not found'
    });
  }
};

// Get Recent Receipts
const getRecentReceipts = async (req, res, next) => {
  try {
    const { limit } = req.query;

    const receipts = await receiptService.getRecentReceipts(limit || 10);

    res.status(200).json({
      success: true,
      count: receipts.length,
      data: receipts
    });
  } catch (error) {
    console.error('Get recent receipts error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get receipts'
    });
  }
};

module.exports = {
  getReceipt,
  getReceiptText,
  getRecentReceipts
};
