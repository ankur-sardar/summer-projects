// created by Kartik Singh on 15/06/2016

import UIKit
import CoreBluetooth

let defaults = NSUserDefaults.standardUserDefaults()
var readerId = defaults.integerForKey("readerId") ?? 0
var ipAddr = defaults.stringForKey("serverIpAddrField") ?? "10.32.0.26"
let port = 10000
let threshold:Int = -90
let timeThreshold:Double = 300

class ViewController: UIViewController, CBCentralManagerDelegate, UIApplicationDelegate, CBPeripheralDelegate {
    @IBOutlet weak var deviceIdField: UITextField!
    @IBOutlet weak var serverIpAddrField: UITextField!
    @IBOutlet weak var statusLabel: UILabel!
    var timeStamp = [String:Double]()
    var centralM:CBCentralManager!
    var peripherals = Array<CBPeripheral>();
    let services: [CBUUID] = [CBUUID(string: "81E7")]
    
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
            self.centralM.scanForPeripheralsWithServices(services , options: [CBCentralManagerScanOptionAllowDuplicatesKey:true])
        }
        else {
            print("Bluetooth is off!");
        }
    }
    
    func centralManager(central: CBCentralManager, didDiscoverPeripheral peripheral: CBPeripheral, advertisementData: [String : AnyObject], RSSI: NSNumber) {
        let uIdentifier = uniqueIDFromAdvertisementDictionary(advertisementData)
        var keygen:String = "NONE";
        var valuegen:Double = 0;
        let url = NSURL(string: "http://\(ipAddr):\(port)/rec/\(readerId)/\(uIdentifier))")!
        let request = NSURLRequest(URL: url)
        let session = NSURLSession.sharedSession()
        let time = NSDate().timeIntervalSince1970
        
        if Int(RSSI) < 0 {
            print(RSSI)
            print(uIdentifier)
            if Int(RSSI) > threshold {
                for (key,value) in timeStamp {
                    if key == uIdentifier {
                        keygen = key
                        valuegen = value
                        break;
                    }
                    else {
                        keygen = "NONE"
                        valuegen = 0
                        }
                    }
                    if keygen == uIdentifier {
                        if (time - valuegen) > timeThreshold {
                            let dataTask = session.dataTaskWithRequest(request) { (data:NSData?, response:NSURLResponse?, error:NSError?) -> Void in
                                print("done, \(RSSI) error: \(error) ")
                            }
                            dataTask.resume()
                        } else {
                            let oldVal = timeStamp.updateValue(time, forKey: keygen)
                            print(oldVal);
                        }
                    } else {
                        timeStamp[uIdentifier] = time;
                        print(timeStamp[uIdentifier])
                        let dataTask = session.dataTaskWithRequest(request) { (data:NSData?, response:NSURLResponse?, error:NSError?) -> Void in
                            print("done, \(RSSI) error: \(error) ")
                        }
                        dataTask.resume()
                }
                statusLabel.text = "\(RSSI)"
            }
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


