<?php
class Taply_Paybutton_Block_Button_Pay extends Mage_Core_Block_Template
{
    public $config =array();
    
    protected function _construct(){
        parent::_construct();
        $this->config = Mage::getStoreConfig('payment/taply');
    } 
    
    protected function _toHtml(){
        $isExtensionEnabled = Mage::getStoreConfigFlag('payment/paybutton/active');
        if (isset($this->config['active']) && $this->config['active']) {
            return parent::_toHtml();
        }
        return '';
        $result = parent::_beforeToHtml();
    }
    
    public function getCartArray(){
        $arrItems = array();
        $session= Mage::getSingleton('checkout/session');
        $quote = $session->getQuote();
        $cartItems = $quote->getAllVisibleItems();
        foreach ($cartItems as $item) { 
            $product = $item->getProduct();
            $arrItems[] = array(
                'item_prod_id'      => $product->getId(),
                'item_prod_attr'    => unserialize($product->getCustomOption('attributes')->getValue()) ,//json_encode( $helper->getOptions($item) ),
                'item_name'         => $product->getName(),
                'item_img'          => (string)Mage::helper('catalog/image')->init($product, 'thumbnail'),
                'item_description'  => Mage::getModel('catalog/product')->load($product->getId())->getShortDescription(),
                'item_qty'          => $item->getQty(),
                'item_price'        => $product->getPrice(),
            );
        }
        
        return array('merchant' => $this->config['merchant_id'],'description' => $this->config['description'],'currency'=>'USD','items' => $arrItems);
        
    }
}