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

        $sOrderCartJson = $arrResponse['result']['cart'];
        $sOrderTransaction =  $arrResponse['result']['transaction'];
        $arrOrderCart =  is_string($sOrderCartJson)? json_decode($sOrderCartJson, TRUE) : $sOrderCartJson;
        $arrOrderTransaction = is_string($sOrderTransaction)?  json_decode( $sOrderTransaction, TRUE) : $sOrderTransaction; 
        
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
                $request = new Varien_Object();
                $request->setQty($item['item_qty']);
                if($item['item_prod_attr']){
                    $product->addCustomOption('attributes', serialize($item['item_prod_attr']));
                    $request->setSuperAttribute($item['item_prod_attr']);
                }
                $links = Mage::getModel('downloadable/product_type')->getLinks( $product );
//                if ($product->getTypeId() == 'simple') {
//                    $product->addProduct($product , 1);
//                    // for downloadable product
//                } else 
                    if ($product->getTypeId() == 'downloadable') {
                    $params = array();
                    $links = Mage::getModel('downloadable/product_type')->getLinks( $product );
                    $linkId = 0;
                    foreach ($links as $link) {
                        $linkId = $link->getId();
                    }
                    $params['product'] = $item['item_prod_id'];
                    $params['qty'] = $item['item_qty'];
                    $params['links'] = array($linkId);
                    $request = new Varien_Object();
                    $request->setData($params);
                    $product->processBuyRequest($product , $request);
//                    $product->addProduct($product , $request);
                }
//                if($links){
//                    $preparedLinks = array();
//                    foreach ($links as $link) {
//                            $preparedLinks[] = $link->getId();
//                    }
//                    if ($preparedLinks) {
//                        
//                file_put_contents('/tmp/taply.log', print_r($preparedLinks, true));
//                        $product->addCustomOption('downloadable_link_ids', implode(',', $preparedLinks));
//                    }
//                    
//                    
//                    
//                    
//                    
//                    $request->setLinks($links);
//                }
                if ($product->getId()) {
                    // Add product to card
                    $result = $quote->addProduct($product, $request);
                    if (is_string($result)) {
                        // Error of adding product to card
                        // @todo Log exception into DB and skip
                file_put_contents('/tmp/taply.log', print_r($result, true), 8);
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
                        ->setPassword($objCustomer->generatePassword(7));
                    try{
                        $objCustomer->save();
                        $objCustomer->setConfirmation(null); //confirmation needed to register
                        $objCustomer->save(); //yes, this is also needed
                        $objCustomer->sendNewAccountEmail(); //send confirmation email to customer
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
                'country_id' => $aUser['billingAddress']['country'] ? $aUser['billingAddress']['country'] : 'US',
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
            $objPayment = $quote->getPayment();
            $objPayment->importData(array('method' => $this->_methodType));
            $objPayment->setAdditionalInformation('payment_id',$_params['payment']);
            $quote->collectTotals()->save();
            $service = Mage::getModel('sales/service_quote', $quote);
            $service->submitAll();
            $objOrder = $service->getOrder();
            if($arrResponse['result']['captured']){
                $objPayment->getMethodInstance()->createInvoice($objOrder);
                $objOrder->setState(Mage_Sales_Model_Order::STATE_PROCESSING, true)->save();
            }
            $lastOrderId = $objOrder->getId();
            $objOrder->sendNewOrderEmail();

            unset($quote);
            unset($service);
            echo json_encode( array('order_id' => $lastOrderId, 'redirect_url' => Mage::getUrl() . '/taply/success/thanks/order/' . $lastOrderId) );

        } catch (Exception $e){
            $quote = $objCustomer = $service = null;
            echo json_encode( array('error' => $e->getMessage()) );
        }

    }
    
    public function thanksAction()
    {
        try{
        $_params = $this->getRequest()->getParams();
        $order = Mage::getModel('sales/order')->load( $_params['order']);
        
        $objChecoutSession = Mage::getSingleton('checkout/session'); 
        $objChecoutSession->setLastQuoteId($order->getQuoteId())->setLastSuccessQuoteId($order->getQuoteId())
            ->setLastOrderId($order->getId())->setLastRealOrderId($order->getIncrementId());
            
        Mage::getSingleton('checkout/cart')->truncate()->save();
        $this->_redirect('checkout/onepage/success');
        }  catch (Exception $e){
            echo $e->getMessage();
        }
    }
}