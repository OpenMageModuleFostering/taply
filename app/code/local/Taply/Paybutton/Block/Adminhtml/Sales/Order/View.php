<?php
class Taply_Paybutton_Block_Adminhtml_Sales_Order_View extends Mage_Adminhtml_Block_Sales_Order_View
{
    const TAPLY_API_URL = "http://rc-api.paybytaply.com/payment/";
    
    public function __construct() {
        //parent constructor
        parent::__construct();
        $paymentMethod = $this->getOrder()->getPayment()->getMethodInstance()->getCode();
        $config = Mage::getStoreConfig('payment/taply');
        
        if($paymentMethod === 'taply'){
            
            $headBlock = Mage::app()->getLayout()->getBlock('head');
            $items = $headBlock->getItems();
            $items['skin_css/admin_taply.css'] = Array ( 
                'type' => 'skin_css', 
                'name' => 'admin_taply.css', 
                'params' => "media=all", 
                'if' => null,
                'cond' => null
                );
            $headBlock->setItems($items);

            $url = self::TAPLY_API_URL . 'get-order-payment';
            $process = curl_init($url);        
            curl_setopt($process, CURLOPT_RETURNTRANSFER, 1);                                                                                                                                                                                    
            curl_setopt($process, CURLOPT_FOLLOWLOCATION, 1);                                                                                                                                                                                    
            curl_setopt($process, CURLOPT_SSL_VERIFYHOST, false);                                                                                                                                                                                
            curl_setopt($process, CURLOPT_SSL_VERIFYPEER, false);                                                                                                                                                                                
            curl_setopt($process, CURLOPT_FOLLOWLOCATION, 1);
            curl_setopt($process, CURLOPT_POST, 1);                                                                                                                                                                                          
            curl_setopt($process, CURLOPT_POSTFIELDS, http_build_query(array("order_id" => $this->getOrder()->getId(), "merchantid" => $config['merchant_id'] ))); 
            $strResponseJson = curl_exec( $process );
            curl_close($process);  
            
            if($strResponseJson){                                                                                                                                                                                                                
                $arrResponse = json_decode( $strResponseJson, TRUE );                                                                                                                                                                                                                                 
            }   
            if($arrResponse['status'] === 'success'){
                
                if($arrResponse['result']['tp_status'] === 1){
                    if(!$arrResponse['result']['tp_captured']){
                        $this->addButtons(['capture', 'void'], $arrResponse['result']['tp_id']);
                    }else{
                        $this->addButtons(['refund'], $arrResponse['result']['tp_id']);
                    }
                    
                }
                
            }
            
        }

    }
    
    protected function addButtons($arrButtons, $strPaymentId){
        foreach ($arrButtons as $strButton){
            
            $url = Mage::helper("adminhtml")->getUrl(
                "adminhtml/taply_order/" . $strButton,
                array('payment_id'=> $strPaymentId, 'order_id' => $this->getOrder()->getId())
            );
            $this->_addButton('cygtest_' . $strButton, array(
                    'label'     => Mage::helper('sales')->__(ucfirst($strButton)),
                    'onclick'   => 'setLocation(\'' . $url . '\')',
                    'class'     => $strButton
            ));
        }
    }

}

