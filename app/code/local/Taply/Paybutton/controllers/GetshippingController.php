<?php
class Taply_Paybutton_GetshippingController extends Mage_Core_Controller_Front_Action{
    
    public function indexAction()
    {
        $store      = Mage::app()->getStore();
        $objCart    = Mage::getModel('sales/quote')->setStoreId($store->getId());
        $objCart->setCustomer(Mage::getModel('customer/customer'));
        $country    = (string) $this->getRequest()->getParam('country_id');
        $postcode   = (string) $this->getRequest()->getParam('estimate_postcode');
        $city       = (string) $this->getRequest()->getParam('estimate_city');
        $region     = (string) $this->getRequest()->getParam('region');
        $itemsJson  = (string) $this->getRequest()->getParam('items');
        $items      = Mage::helper('core')->jsonDecode($itemsJson);
        $regionModel = Mage::getModel('directory/region')->loadByCode($region, $country);
        $regionId = $regionModel->getId();
        
        try{
            foreach ($items as $item){
                $product = Mage::getModel('catalog/product')->load($item['item_prod_id']);
                $product->setPrice($item['item_price']);
                $product->addCustomOption('attributes', serialize($item['item_prod_attr']));
                $request = new Varien_Object();
                $request->setQty($item['item_qty']);
                $request->setSuperAttribute($item['item_prod_attr']);
                if ($product->getId()) {
                    // Add product to card
                    $result = $objCart->addProduct($product, $request);
                    if (is_string($result)) {
                        // Error of adding product to card
                        // @todo Log exception into DB and skip
                        throw new Exception("{error: '$result'}");
                    }
                } else {
                    // Error of load product by id
                    throw new Exception("{error: 'Cant load product'}");
                    // @todo Log exception into DB and skip
                }
            }

            
            $sa = $objCart->getShippingAddress();
            $sa->setCountryId($country)
                ->setCity($city)
                ->setPostcode($postcode)
                ->setRegionId($regionId)
                ->setRegion($region)
                ->setCollectShippingRates(TRUE)->save();
//            var_dump($sa->toArray());
        }  catch (Exception $e){
            die($e->getMessage());
        }
        
            $objCart->save();
            
            $objCart->collectTotals();
            $objCart->save();

        $quoteData= $sa->getData();
        $arrShipping=array("shippings" => array(), "tax" => $quoteData['tax_amount']);
        foreach ($sa->getGroupedAllShippingRates() as $strCode => $arrRates ){
            foreach ($arrRates as $objRate){
                $name = Mage::getStoreConfig('carriers/'.$strCode.'/title');
                $strCarrierName = $name? $name : strtoupper($strCode);
                $arrShipping["shippings"][] = array(
                    "identifier" => $objRate->getCode(),
                    "label" => $strCarrierName . " " . $objRate->getMethodTitle(),
                    "amount" => $objRate->getPrice(),
                    "detail" => $strCarrierName . " " . $objRate->getMethodTitle() . ", $" . $objRate->getPrice()
                );
            }
        }
        echo Mage::helper('core')->jsonEncode($arrShipping);

    }

}
