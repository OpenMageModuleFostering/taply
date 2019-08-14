<?php
class Taply_Paybutton_Adminhtml_Taply_OrderController extends Mage_Adminhtml_Controller_Action{
    protected $_orderId = 0;
    protected function getOrder(){
        $this->orderId = $this->getRequest()->getParam('order_id');
        $objOrder = Mage::getModel('sales/order')->load($this->orderId);
        return $objOrder;
    }

    public function captureAction(){
        $objOrder = $this->getOrder();
        $objOrder->getPayment()->getMethodInstance()->capture($objOrder);
        
    }
    
    public function voidAction(){
        $objOrder = $this->getOrder();
        $objOrder->getPayment()->getMethodInstance()->void($objOrder);
        
    }
    
    public function refundAction(){
        $objOrder = $this->getOrder();
        $objOrder->getPayment()->getMethodInstance()->refund($objOrder);
        
    }
}
