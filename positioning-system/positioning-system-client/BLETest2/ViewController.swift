// created by Kartik Singh on 15/06/2016

import UIKit
import CoreBluetooth

let defaults = NSUserDefaults.standardUserDefaults()
var readerId = defaults.integerForKey("readerId") ?? 0
var ipAddr = defaults.stringForKey("serverIpAddrField") ?? "10.32.0.26"
let port = 10000
let threshold = -60
let timeThreshold = 2.0

class ViewController: UIViewController, CBCentralManagerDelegate, UIApplicationDelegate, CBPeripheralDelegate {
    @IBOutlet weak var deviceIdField: UITextField!
    @IBOutlet weak var serverIpAddrField: UITextField!
    @IBOutlet weak var statusLabel: UILabel!
    var timeStamp = [String:Double]()
    var centralM:CBCentralManager?
    var peripherals = Array<CBPeripheral>();
    let services = [CBUUID(string: "81E7")]
    
    @IBAction func configSetButtonPressed(sender: AnyObject) {
        guard let readerIdText = deviceIdField.text, readerIdRaw = Int(readerIdText), ipAddrRaw = serverIpAddrField.text else {
            return
        }
        readerId = readerIdRaw
        ipAddr = ipAddrRaw
        deviceIdField.resignFirstResponder()
        serverIpAddrField.resignFirstResponder()
        defaults.setInteger(readerId, forKey: "readerId")
        defaults.setObject(ipAddr, forKey: "serverIpAddrField")
        print("readerId: \(readerId), ipAddr:\(ipAddr)")
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        timeStamp["NONE"] = 0
        let queue = dispatch_queue_create("com.uievolution.BLETest2", DISPATCH_QUEUE_SERIAL)
        centralM = CBCentralManager(delegate:self,queue:queue)
        deviceIdField.text = "\(readerId)"
        serverIpAddrField.text = "\(ipAddr)"
    }
    
    func centralManagerDidUpdateState(central: CBCentralManager) {
        if central.state == CBCentralManagerState.PoweredOn {
            print("Bluetooth is on!");
            self.centralM?.scanForPeripheralsWithServices(services , options: [CBCentralManagerScanOptionAllowDuplicatesKey:true])
        }
        else {
            print("Bluetooth is off!");
        }
    }
    
    func uniqueIDFromAdvertisementDictionary(dictionary: NSDictionary) -> String {
        var ret = "unknown"
        if let serviceDict = dictionary["kCBAdvDataServiceData"] {
            let sDict = serviceDict as! NSDictionary
            let firstVal = sDict.allValues.first as! NSData
            let uniqueIdData = firstVal.subdataWithRange(NSMakeRange(4, 6))
            ret = uniqueIdData.hexadecimalString as String
        }
        return ret
    }
    
    func centralManager(central: CBCentralManager, didDiscoverPeripheral peripheral: CBPeripheral, advertisementData: [String : AnyObject], RSSI: NSNumber) {
        let time = NSDate().timeIntervalSince1970
        let url = NSURL(string: "http://\(ipAddr):\(port)/rec/\(readerId)/\(uniqueIDFromAdvertisementDictionary(advertisementData))/\(RSSI)")!
        let request = NSURLRequest(URL: url)
        let session = NSURLSession.sharedSession()
        
        if Int(RSSI) < 0 {
            print(RSSI)
            print(uniqueIDFromAdvertisementDictionary(advertisementData))
            if Int(RSSI) > threshold {
                timeStamp["NONE"] = 0;
                let value = timeStamp[uniqueIDFromAdvertisementDictionary(advertisementData)]
                if value != nil {
                    if (time >= (value!+timeThreshold)) {
                        let oldVal = timeStamp.updateValue(time, forKey: uniqueIDFromAdvertisementDictionary(advertisementData))
                        print("Old val : \(oldVal)");
                        let dataTask = session.dataTaskWithRequest(request) { (data:NSData?, response:NSURLResponse?, error:NSError?) -> Void in
                            print("done, \((Int(RSSI))) error: \(error) ")
                        }
                        dataTask.resume()
                    }
                }
                else {
                    timeStamp[uniqueIDFromAdvertisementDictionary(advertisementData)] = time;
                    print(timeStamp[uniqueIDFromAdvertisementDictionary(advertisementData)])
                    let dataTask = session.dataTaskWithRequest(request) { (data:NSData?, response:NSURLResponse?, error:NSError?) -> Void in
                        print("done, \((Int(RSSI))) error: \(error) ")
                    }
                    dataTask.resume()
                }
            }
        }
    }
}

extension NSData {
    @objc(kdj_hexadecimalString)
    public var hexadecimalString: NSString {
        var bytes = [UInt8](count: length, repeatedValue: 0)
        getBytes(&bytes, length: length)
        let hexString = NSMutableString()
        for byte in bytes {
            hexString.appendFormat("%02x", UInt(byte))
        }
        return NSString(string: hexString)
    }
}


