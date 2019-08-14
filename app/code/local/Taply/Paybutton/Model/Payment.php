<?php
/**
 * Magento
 * @category    Taply
 * @package     Taply_Paybutton
 * @copyright  Copyright (c) 2006-2015 X.commerce, Inc. (http://www.magento.com)
 * @license    http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

/**
 * Used in creating options for Yes|No config value selection
 *
 */
class Taply_Paybutton_Model_Payment  extends Mage_Payment_Model_Method_Abstract
{
    const TAPLY_API_URL = "http://api.taplycheckout.com/payment/";
    
    protected $_code        = 'taply';
    
    
    public function getTitle(){
        return 'Taply';
    }
    
    protected function _callApiMethod($strMethod, $arrParams = array()){

        $arrResponse = array();   

        $process = curl_init(self::TAPLY_API_URL . $strMethod); 
        
        curl_setopt($process, CURLOPT_RETURNTRANSFER, 1);                                                                                                                                                                                    
        curl_setopt($process, CURLOPT_FOLLOWLOCATION, 1);                                                                                                                                                                                    
        curl_setopt($process, CURLOPT_SSL_VERIFYHOST, false);                                                                                                                                                                                
        curl_setopt($process, CURLOPT_SSL_VERIFYPEER, false);                                                                                                                                                                                
        curl_setopt($process, CURLOPT_FOLLOWLOCATION, 1);    
        
        if (!empty($arrParams)){                                                                                                                                                                                                
            $config = Mage::getStoreConfig('payment/taply');
            $arrParams['merchant'] = $config['merchant_id'];   
            print_r($arrParams);
            curl_setopt($process, CURLOPT_POST, 1);                                                                                                                                                                                          
            curl_setopt($process, CURLOPT_POSTFIELDS, http_build_query($arrParams));                                                                                                                                                         
        }                                                                                                                                                                                                                                    
        $strResponseJson = curl_exec( $process );                                                                                                                                                                                            
        curl_close($process);  
        
        if($strResponseJson){                                                                                                                                                                                                                
            $arrResponse = json_decode( $strResponseJson, TRUE );                                                                                                                                                                            
                                                                                                                                                                                                                                             
        }                                                                                                                                                                                                                                    
        return $arrResponse;                                                                                                                                                                                                                 
    }  
    
    /**
     * Capture payment
     *
     * @param Mage_Sales_Model_Order_Payment $objPayment
     * @param String $orderId
     * @return Taply_Paybutton_Model_Payment
     */
    public function capture(Varien_Object $objOrder)
    {
        $objPayment = $objOrder->getPayment();
        $paymentId = $objPayment->getAdditionalInformation('payment_id');
        $arrResponse = $this->_callApiMethod('capture', array('payment' => $paymentId));
        if($arrResponse && !isset($arrResponse['error'])){
            Mage::getSingleton('core/session')->addSuccess("Payment has been processed");
            $this->createInvoice($objOrder);
            $objOrder->setState(Mage_Sales_Model_Order::STATE_PROCESSING, true)->save();
            
        }else{
            Mage::getSingleton('core/session')->addError('Taply Error: ' . $arrResponse['error']);
        }
        Mage::app()->getResponse()->setRedirect(Mage::helper('adminhtml')->getUrl("adminhtml/sales_order/view", array('order_id'=> $objOrder->getId())));
    }
        
    /**
     * Void payment
     *
     * @param Mage_Sales_Model_Order_Payment $objPayment
     * @param String $orderId
     * @return Taply_Paybutton_Model_Payment
     */
    public function void(Varien_Object $objOrder)
    {
        $objPayment = $objOrder->getPayment();
        $paymentId = $objPayment->getAdditionalInformation('payment_id');
        $arrResponse = $this->_callApiMethod('void', array('payment' => $paymentId));
        if($arrResponse && !isset($arrResponse['error'])){
            Mage::getSingleton('core/session')->addSuccess("Payment has been  voided");
        }else{
            Mage::getSingleton('core/session')->addError('Taply Error: ' . $arrResponse['error']);
        }
        Mage::app()->getResponse()->setRedirect(Mage::helper('adminhtml')->getUrl("adminhtml/sales_order/view", array('order_id'=> $objOrder->getId())));
    }
        
    /**
     * Refund payment
     *
     * @param Mage_Sales_Model_Order_Payment $objPayment
     * @param String $orderId
     * @return Taply_Paybutton_Model_Payment
     */
    public function refund(Varien_Object $objOrder)
    { 
        $objPayment = $objOrder->getPayment();
        $paymentId = $objPayment->getAdditionalInformation('payment_id');
        $arrResponse = $this->_callApiMethod('refund', array('payment' => $paymentId));
        if($arrResponse && !isset($arrResponse['error'])){
            Mage::getSingleton('core/session')->addSuccess("Payment has been refunded");
        }else{
            Mage::getSingleton('core/session')->addError('Taply Error: ' . $arrResponse['error']);
        }
        Mage::app()->getResponse()->setRedirect(Mage::helper('adminhtml')->getUrl("adminhtml/sales_order/view", array('order_id'=> $objOrder->getId())));
    }
    
    public function createInvoice($objOrder){
        try {
            if(!$objOrder->canInvoice()){
                Mage::throwException(Mage::helper('core')->__('Cannot create an invoice.'));
            }

            $invoice = Mage::getModel('sales/service_order', $objOrder)->prepareInvoice();

            if (!$invoice->getTotalQty()) {
                Mage::throwException(Mage::helper('core')->__('Cannot create an invoice without products.'));
            }

            $invoice->setRequestedCaptureCase(Mage_Sales_Model_Order_Invoice::CAPTURE_ONLINE);
            $invoice->register();
//            $transactionSave = Mage::getModel('core/resource_transaction')
//            ->addObject($invoice)
//            ->addObject($invoice->getOrder());
//
//            $transactionSave->save();
            
        }catch (Mage_Core_Exception $e) {

        }
    }
}
