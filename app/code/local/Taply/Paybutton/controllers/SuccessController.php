<?php
class Taply_Paybutton_SuccessController extends Mage_Core_Controller_Front_Action{
    const TAPLY_API_URL = "https://api.paybytaply.com/payment/";

    
    protected $_methodType = 'taply';

    protected function _callApiMethod($strMethod, $arrParams = array()){

        $arrResponse = array();
        $process = curl_init(self::TAPLY_API_URL . $strMethod);
        curl_setopt($process, CURLOPT_RETURNTRANSFER, 1); 
        curl_setopt($process, CURLOPT_FOLLOWLOCATION, 1); 
        curl_setopt($process, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($process, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($process, CURLOPT_FOLLOWLOCATION, 1); 
        if (!empty($arrParams)){
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


    public function indexAction()
    {
        $_params = $this->getRequest()->getParams();
        $config = Mage::getStoreConfig('payment/taply');
        $arrResponse = $this->_callApiMethod('get-payment-info', array('payment' => $_params['payment'], 'merchantid' => $config['merchant_id'] )); 
        
        if(!isset($arrResponse['result']['cart'])){
            echo json_encode(array('error' => 'Carts not matched'));
            exit();
        }
        $sOrderCartJson = $arrResponse['result']['cart'];
        $sOrderTransaction =  $arrResponse['result']['transaction'];
        $arrOrderCart =  json_decode($sOrderCartJson, TRUE);
        $arrOrderTransaction =  json_decode( $sOrderTransaction, TRUE);
        if(isset($arrResponse['result']['order_id']) && $arrResponse['result']['order_id']){
            $order = Mage::getModel('sales/order')->load($arrResponse['result']['order_id']);
            if($order->getId()){
                echo json_encode( array('order_id' => $order->getId(), 'redirect_url' =>  Mage::getUrl() . '/taply/success/thanks/order/' . $order->getId()) );
                exit;
            }
        }
        try{

            $store = Mage::app()->getStore();
            $quote = Mage::getModel('sales/quote')->setStoreId($store->getId());

            $aUser = $arrOrderTransaction['user_info'];
            $objCustomer = Mage::getModel('customer/customer');
            $websiteId = Mage::app()->getWebsite()->getId();
            $objCustomer->setWebsiteId($websiteId)->setStore($store);
            
            foreach ($arrOrderCart['items'] as $item){
                
                $product = Mage::getModel('catalog/product')->load($item['item_prod_id']);
                $product->setPrice($item['item_price']);
                $product->addCustomOption('attributes', serialize($item['item_prod_attr']));
                $request = new Varien_Object();
                $request->setQty($item['item_qty']);
                $request->setSuperAttribute($item['item_prod_attr']);
                if ($product->getId()) {
                    // Add product to card
                    $result = $quote->addProduct($product, $request);
                    if (is_string($result)) {
                        // Error of adding product to card
                        // @todo Log exception into DB and skip
                        throw new Exception($result);
                    }
                } else {
                    // Error of load product by id
                    throw new Exception("Cant load product");
                    // @todo Log exception into DB and skip
                }
            }
            if(isset($aUser['billingAddress']['email'])){
                $objCustomer->loadByEmail($aUser['billingAddress']['email']);
                if (!$objCustomer->getId()){
                    $objCustomer->setFirstname($aUser['billingAddress']['firstName'])
                                ->setLastname($aUser['billingAddress']['lastName'])
                                ->setEmail($aUser['billingAddress']['email'])
                                ->setPassword($customer->generatePassword(7));
                    

                    try{
                        $objCustomer->save();
                        $objCustomer->setConfirmation(null); //confirmation needed to register
                        $objCustomer->save(); //yes, this is also needed
                        $objCustomer->sendNewAccountEmail(); //send confirmation email to customer

//                        $newResetPasswordLinkToken =  Mage::helper('customer')->generateResetPasswordLinkToken();
//                        $objCustomer->changeResetPasswordLinkToken($newResetPasswordLinkToken);
//                        $objCustomer->sendPasswordResetConfirmationEmail();
                    } 
                    catch (Exception $e) {
                        Zend_Debug::dump($e->getMessage());
                    }
                }
            }     
            
            $quote->setCustomer($objCustomer);
            Mage::getSingleton('customer/session')->loginById($objCustomer->getId());
            
            $billingAddress = array(
                'firstname' => $aUser['billingAddress']['firstName'],
                'lastname' => $aUser['billingAddress']['lastName'],
                'email' => $aUser['billingAddress']['email'],
                'country_id' => $aUser['billingAddress']['country'],
                'region' => $aUser['billingAddress']['state'],
                'postcode' => $aUser['billingAddress']['zip'],
                'street' => $aUser['billingAddress']['street1'], //array( $aUser['billingAddress']['street1'], $aUser['billingAddress']['street2'] ),
                'city' => $aUser['billingAddress']['city'],
                'telephone' => $aUser['billingAddress']['phone'],
                'save_in_address_book' => 0,
            );
            $shippingAddressData = array(
                'firstname' => $aUser['shippingAddress']['firstName'],
                'lastname' => $aUser['shippingAddress']['lastName'],
                'email' => $aUser['shippingAddress']['email'],
                'country_id' => $aUser['shippingAddress']['country'],
                'region' => $aUser['shippingAddress']['state'],
                'postcode' => $aUser['shippingAddress']['zip'],
                'street' =>  $aUser['shippingAddress']['street1'], //array( $aUser['shippingAddress']['street1'], $aUser['shippingAddress']['street2'] ),
                'city' => $aUser['shippingAddress']['city'],
                'telephone' => $aUser['shippingAddress']['phone'],
                'save_in_address_book' => 0,
            );
//var_dump($arrOrderTransaction['shipping']['identifier']);die;
            if(isset($arrOrderTransaction['shipping']['identifier']) && strpos(strtolower($arrResponse['result']['shipping']['identifier']), "free") === FALSE){
                $shippingMethod = $arrOrderTransaction['shipping']['identifier']; 
            }else{
                $shippingMethod = 'freeshipping_freeshipping';
            }
            $quote->getBillingAddress()->addData($billingAddress);
            $quote->getShippingAddress()
                ->addData($shippingAddressData)
                ->setShippingMethod($shippingMethod)
                ->setPaymentMethod($this->_methodType)
                ->setCollectShippingRates(true)
                ->collectTotals();
            $quote->getPayment()->importData(array('method' => $this->_methodType));
            $quote->collectTotals()->save();
            $service = Mage::getModel('sales/service_quote', $quote);
            $service->submitAll();
            $lastOrderId = $service->getOrder()->getId();

            unset($quote);
            unset($objCustomer);
            unset($service);
            echo json_encode( array('order_id' => $lastOrderId, 'redirect_url' => Mage::getUrl() . '/taply/success/thanks/order/' . $lastOrderId) );

        } catch (Exception $e){
            $quote = $customer = $service = null;
            echo json_encode( array('error' => $e->getMessage()) );
        }	

    }

    public function thanksAction()
    {
        Mage::getSingleton('checkout/cart')->truncate()->save();
        $_params = $this->getRequest()->getParams();
        $this->_redirect('sales/order/view/', array('order_id' => $_params['order']));

    }
}
